import { useState, useCallback, FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Send, Navigation, Map as MapIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateReport, useReports } from "@shared/hooks/useReports";
import type { Report as ReportType } from "@shared/hooks/useReports";
import { Link } from "react-router-dom";
import { z } from "zod";
import { alert } from "@/lib/alerts";
import { THAI_PROVINCES } from "@/constants/thaiProvinces";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { MapContainer, Marker, Popup, TileLayer, useMapEvents } from "react-leaflet";
import type { Coordinates } from "@/lib/leaflet";
import {
  defaultMapCenter,
  tileLayerUrl,
  tileLayerOptions,
  locationMarkerIcon,
  openMarkerPopup,
  closeMarkerPopup,
  pinMarkerPopup,
  releaseMarkerPopup,
} from "@/lib/leaflet";
import ReportMapOverview from "@/components/ReportMapOverview";

const reportSchema = z.object({
  province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  district: z.string().trim().min(1, "กรุณากรอกเขต/อำเภอ").max(100, "เขต/อำเภอต้องไม่เกิน 100 ตัวอักษร"),
  location: z.string().trim().min(1, "กรุณากรอกสถานที่").max(200, "สถานที่ต้องไม่เกิน 200 ตัวอักษร"),
  description: z.string().max(1000, "รายละเอียดต้องไม่เกิน 1000 ตัวอักษร").optional(),
});

const Report = () => {
  const { user } = useAuth();
  const { data: reports } = useReports();
  const createReport = useCreateReport();
  const mapButtonClass = "bg-[#b54708] text-white hover:bg-[#93310a] shadow-md hover:shadow-lg border-transparent";
  
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Tags / structured data
  const [species, setSpecies] = useState<'dog' | 'cat' | 'other' | ''>('');
  const [condition, setCondition] = useState<'normal' | 'injured' | 'pregnant' | 'aggressive' | ''>('');
  const [collar, setCollar] = useState<'yes' | 'no' | ''>('');

  const reverseGeocode = useCallback(async (coords: Coordinates) => {
    // Helper: remove leading postal code and noise from district string
    const cleanDistrictString = (s?: string | null) => {
      if (!s) return '';
      let v = String(s).trim();
      // remove leading 5-digit postal code (e.g. "10400 ")
      v = v.replace(/^\s*\d{5}\s*[-,]?\s*/g, '');
      // remove common labels like 'รหัสไปรษณีย์'
      v = v.replace(/^\s*(รหัสไปรษณีย์|zipcode)\s*/i, '');
      // trim again
      v = v.trim();
      // remove trailing country mention
      v = v.replace(/,?\s*(ประเทศไทย|Thailand)\s*$/i, '');
      // avoid returning purely numeric or too-short values
      if (/^\d+$/.test(v)) return '';
      if (v.length <= 1) return '';
      return v;
    };

    // Helper: given comma-separated display parts, try to pick the most likely district/amphoe
    const extractDistrictFromParts = (parts: string[]) => {
      // 1) look for explicit keywords
      const explicit = parts.find((p) => /\b(เขต|อำเภอ|แขวง|ตำบล|อ\.|ต\.)\b/.test(p));
      if (explicit) {
        const cleaned = cleanDistrictString(explicit);
        if (cleaned && !/^(ประเทศไทย|Thailand)$/i.test(cleaned)) return cleaned;
      }

      // 2) find province index then take previous token as district (common pattern)
      const provIndex = parts.findIndex((p) => THAI_PROVINCES.some((pv) => p.includes(pv)));
      if (provIndex > 0) {
        const candidate = parts[provIndex - 1];
        const cleaned = cleanDistrictString(candidate);
        if (cleaned && !THAI_PROVINCES.includes(cleaned)) return cleaned;
      }

      // 3) fallback: take first non-numeric, non-postcode short token that is not street number and not country/province
      const fallback = parts.find((p) => {
        const t = p.trim();
        if (!t) return false;
        if (/^\d+$/.test(t)) return false;
        if (/^\d{1,4}\//.test(t)) return false;
        if (/^[0-9]{1,5}\s/.test(t)) return false;
        if (/^(ประเทศไทย|Thailand)$/i.test(t)) return false;
        // avoid matching province names
        if (THAI_PROVINCES.some((pv) => t.includes(pv))) return false;
        return t.length <= 40; // avoid very long descriptors
      });
      const cleanedFallback = cleanDistrictString(fallback || '');
      if (cleanedFallback) return cleanedFallback;
      // last resort: try to return first meaningful part that isn't country
      for (const p of parts) {
        const c = cleanDistrictString(p);
        if (c && !/^(ประเทศไทย|Thailand)$/i.test(c) && !THAI_PROVINCES.includes(c)) return c;
      }
      return '';
    };

    const setCoordsFallback = () => {
      if (!location) setLocation(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
    };

    // 1) Try Netlify proxy (Nominatim)
    try {
      const url = new URL('/.netlify/functions/reverse-geocode', window.location.origin);
      url.searchParams.set('lat', coords.lat.toString());
      url.searchParams.set('lon', coords.lng.toString());
      url.searchParams.set('lang', 'th');

      const response = await fetch(url.toString());
      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await response.json();
          console.debug('[reverseGeocode] nominatim response', data);
          const address = data.address ?? {};
          if (address.state) setProvince(address.state);
          // Try multiple possible fields from Nominatim to determine district/county/suburb
          const districtCandidates = [
            address.district,
            address.county,
            address.city_district,
            address.city,
            address.town,
            address.village,
            address.suburb,
            address.hamlet,
            address.municipality,
            address.state_district,
          ];
          const firstDistrict = districtCandidates.find((v) => typeof v === 'string' && v.trim().length > 0);
          if (firstDistrict) setDistrict(firstDistrict as string);
          if (data.display_name) setLocation(data.display_name);
          // If district not found from address fields, try to extract from display_name
          if ((!district || district.trim().length === 0) && data.display_name) {
            try {
              const full = String(data.display_name);
              // High-priority: match patterns like '10400 เขตดินแดง' or 'เขตดินแดง'
              const re = /(?:\d{5}\s*,?\s*)?(เขต|อำเภอ|แขวง|ตำบล|อ\.|ต\.)\s*([^,]+)/u;
              const m = full.match(re);
              if (m && m[1] && m[2]) {
                const candidate = `${m[1]} ${m[2].trim()}`.trim();
                const cleaned = cleanDistrictString(candidate);
                if (cleaned) {
                  setDistrict(cleaned);
                }
              } else {
                const parts = full.split(',').map((p) => p.trim()).filter(Boolean);
                const extracted = extractDistrictFromParts(parts);
                if (extracted) setDistrict(extracted);
                // Try to detect province by matching against known provinces
                if ((!province || province.trim().length === 0) && parts.length > 0) {
                  const foundProv = THAI_PROVINCES.find((pv) => parts.some((part) => part.includes(pv)));
                  if (foundProv) setProvince(foundProv);
                }
              }
            } catch (parseErr) {
              console.warn('[reverseGeocode] failed parsing display_name for district', parseErr);
            }
          }
          return; // success
        }
      }
    } catch (err) {
      console.warn('reverse-geocode proxy failed:', err);
    }

    // 2) Fallback: try MapTiler reverse geocoding if API key is available
    try {
      const key = (import.meta.env.VITE_MAPTILER_API_KEY as string) || '';
      if (key && key.trim().length > 0) {
        const k = encodeURIComponent(key.trim());
        const candidates = [
          `https://api.maptiler.com/geocoding/${coords.lng},${coords.lat}.json?key=${k}&language=th`,
          `https://api.maptiler.com/geocoding/${coords.lat},${coords.lng}.json?key=${k}&language=th`,
          `https://api.maptiler.com/geocoding?key=${k}&point=${coords.lng},${coords.lat}&language=th`,
        ];

        for (const mtUrl of candidates) {
          try {
            const mtResp = await fetch(mtUrl);
            if (!mtResp.ok) {
              console.warn('MapTiler candidate returned non-OK', mtUrl, mtResp.status);
              continue;
            }
            const mtData = await mtResp.json();
            const feat = Array.isArray(mtData?.features) && mtData.features[0];
            const props = feat?.properties ?? {};
            console.debug('[reverseGeocode] maptiler properties', props, feat);
            if (props.region) setProvince(props.region);
            // Try several MapTiler property names for district/county/locality
            const mtDistrictCandidates = [
              props.county,
              props.district,
              props.locality,
              props.neighbourhood,
              props.suburb,
              props.place,
              props.name,
            ];
            const mtFirstDistrict = mtDistrictCandidates.find((v) => typeof v === 'string' && v.trim().length > 0);
            if (mtFirstDistrict) setDistrict(mtFirstDistrict as string);
            if (props.label || feat?.place_name || props.name) setLocation(props.label || feat?.place_name || props.name);
            // If district still empty, try to use place_name/display label
            if ((!district || district.trim().length === 0)) {
              const display = props.label || feat?.place_name || props.name || '';
              if (display) {
                try {
                  const full = String(display);
                  const re = /(?:\d{5}\s*,?\s*)?(เขต|อำเภอ|แขวง|ตำบล|อ\.|ต\.)\s*([^,]+)/u;
                  const m = full.match(re);
                  if (m && m[1] && m[2]) {
                    const candidate = `${m[1]} ${m[2].trim()}`.trim();
                    const cleaned = cleanDistrictString(candidate);
                    if (cleaned) setDistrict(cleaned);
                  } else {
                    const parts = full.split(',').map((p) => p.trim()).filter(Boolean);
                    const mtDistrict = extractDistrictFromParts(parts);
                    if (mtDistrict) setDistrict(mtDistrict);
                    if ((!province || province.trim().length === 0)) {
                      const foundProv = THAI_PROVINCES.find((pv) => parts.some((part) => part.includes(pv)));
                      if (foundProv) setProvince(foundProv);
                    }
                  }
                } catch (parseErr) {
                  console.warn('[reverseGeocode] failed parsing MapTiler display for district', parseErr);
                }
              }
            }
            return;
          } catch (innerErr) {
            console.warn('MapTiler candidate parse failed', innerErr);
            continue;
          }
        }
      }
    } catch (err) {
      console.warn('MapTiler reverse-geocode failed:', err);
    }

    // 3) Last resort: fallback to coords if no service available
    setCoordsFallback();
  }, [location, district, province]);

  const handleCoordinatesChange = useCallback((coords: Coordinates, options?: { reverse?: boolean }) => {
    setCoordinates(coords);
    setGeoStatus(`ละติจูด ${coords.lat.toFixed(5)}, ลองจิจูด ${coords.lng.toFixed(5)}`);
    if (options?.reverse) {
      void reverseGeocode(coords);
    }
  }, [reverseGeocode]);

  const handleGetLocation = useCallback(() => {
    // Use Promise wrapper to simplify async flow and avoid silent failures
    if (!navigator.geolocation) {
      alert.error("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
      return;
    }

    const getCurrentPositionAsync = () =>
      new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

    (async () => {
      setIsLocating(true);
      try {
        console.log('[DEBUG] Requesting current position...');
        const position = await getCurrentPositionAsync();
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude } as Coordinates;
        console.log('[DEBUG] current position:', coords);
        handleCoordinatesChange(coords, { reverse: true });
      } catch (err: any) {
        console.error('[DEBUG] getCurrentPosition error', err);
        alert.error('ไม่สามารถดึงตำแหน่งได้', {
          description: err?.message || String(err),
        });
      } finally {
        setIsLocating(false);
      }
    })();
  }, [handleCoordinatesChange]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      window.location.href = "/login";
      return;
    }

    if (!coordinates) {
      alert.error("กรุณาเลือกตำแหน่งบนแผนที่ก่อนส่งรายงาน");
      return;
    }

    try {
      const validatedData = reportSchema.parse({
        province,
        district,
        location,
        description,
      });

      // Build tags (structured data) and prepend to description so it's stored
      const speciesLabel = species === 'dog' ? 'หมา' : species === 'cat' ? 'แมว' : species === 'other' ? 'อื่นๆ' : '';
      const conditionLabel = condition === 'normal' ? 'ปกติ' : condition === 'injured' ? 'บาดเจ็บ/ป่วย' : condition === 'pregnant' ? 'ตั้งครรภ์/ลูกอ่อน' : condition === 'aggressive' ? 'ดุร้าย' : '';
      const collarLabel = collar === 'yes' ? 'มี' : collar === 'no' ? 'ไม่มี' : '';

      const tags: string[] = [];
      if (speciesLabel) tags.push(`ชนิด: ${speciesLabel}`);
      if (conditionLabel) tags.push(`สภาพ: ${conditionLabel}`);
      if (collarLabel) tags.push(`ปลอกคอ: ${collarLabel}`);

      const tagsString = tags.length > 0 ? tags.join(' | ') + '\n\n' : '';

      const payload: any = {
        province: validatedData.province,
        district: validatedData.district,
        location: validatedData.location,
        description: tagsString + (validatedData.description || ''),
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        cat_count: 1,
        status: "pending",
        user_id: user.id,
      };

      // Only include `photo_urls` (array) when we have uploaded images
      if (imageUrls && imageUrls.length > 0) {
        payload.photo_urls = imageUrls;
      }

      await createReport.mutateAsync(payload);

      setProvince("");
      setDistrict("");
      setLocation("");
      setDescription("");
      setCoordinates(null);
      setGeoStatus(null);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          alert.error(err.message);
        });
      } else {
        console.error("Failed to submit report:", error);
        alert.error("ไม่สามารถส่งรายงานได้ โปรดลองอีกครั้ง");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8 pt-32 sm:pt-12 md:pt-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 font-prompt">แจ้งจุดพบสัตว์จรจัด 📍</h1>
          <p className="text-muted-foreground font-prompt">ช่วยกันบันทึกจุดพบหมาหรือแมวจรจัด เพื่อให้อาสาสมัครช่วยเหลือหาบ้าน รักษา หรือทำหมันในพื้นที่</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild className={`w-full sm:w-auto gap-2 font-prompt ${mapButtonClass}`}>
              <Link to="/reports/map">
                <MapIcon className="h-4 w-4" />
                ดูรายงานบนแผนที่
              </Link>
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto gap-2 font-prompt"
              onClick={handleGetLocation}
              disabled={isLocating}
            >
              <Navigation className="h-4 w-4" />
              {isLocating ? "กำลังระบุตำแหน่ง..." : "ใช้ตำแหน่งปัจจุบัน"}
            </Button>
          </div>
        </div>

        <Card className="p-6 shadow-card mb-8">
          {!user && (
            <div className="mb-4 p-4 bg-accent/10 border border-accent rounded-lg">
              <p className="text-sm font-prompt text-center">
                🐾 <Link to="/login" className="font-semibold text-primary hover:underline">เข้าสู่ระบบ</Link> เพื่อแจ้งเจอสัตว์จรในพื้นที่ของคุณ
              </p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Location */}
            <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 shadow-sm space-y-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold">1</div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-primary font-semibold">ระบุจุดที่พบ</p>
                    <h2 className="text-lg font-bold font-prompt">เลือกจังหวัดและตำแหน่งบนแผนที่</h2>
                    <p className="text-sm text-muted-foreground">กรอกข้อมูลที่เห็นชัดเจนที่สุด เพื่อให้ทีมอาสาเดินทางไปถูกต้อง</p>
                  </div>
                </div>
                {geoStatus && <span className="text-xs text-muted-foreground font-prompt">{geoStatus}</span>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="province" className="font-prompt">จังหวัด *</Label>
                  <Select value={province} onValueChange={setProvince} required>
                    <SelectTrigger className="font-prompt"><SelectValue placeholder="เลือกจังหวัด" /></SelectTrigger>
                    <SelectContent className="max-h-64 overflow-y-auto">
                      {THAI_PROVINCES.map((provinceName) => (
                        <SelectItem key={provinceName} value={provinceName} className="font-prompt">
                          {provinceName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="district" className="font-prompt">เขต/อำเภอ *</Label>
                  <Input value={district} onChange={(e) => setDistrict(e.target.value)} required className="font-prompt" placeholder="ตัวอย่าง: เขตดินแดง" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location" className="font-prompt">สถานที่ *</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} required className="font-prompt" placeholder="เช่น หน้าร้านขายยา ซอยอยู่เจริญ" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label className="font-prompt">ตำแหน่งบนแผนที่ *</Label>
                    <p className="text-xs text-muted-foreground">แตะที่แผนที่เพื่อวางหมุด หรือกดปุ่มจับตำแหน่งให้ระบบช่วย</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" className="gap-2" onClick={handleGetLocation} disabled={isLocating}>
                    <Navigation className="h-3.5 w-3.5" />
                    {isLocating ? "กำลังค้นหา..." : "ใช้ตำแหน่งของฉัน"}
                  </Button>
                </div>
                <div className="h-[260px] sm:h-[320px] lg:h-80 overflow-hidden rounded-2xl border bg-white">
                  <MapContainer
                    key={`${coordinates?.lat ?? defaultMapCenter.lat}-${coordinates?.lng ?? defaultMapCenter.lng}`}
                    center={coordinates ?? defaultMapCenter}
                    zoom={coordinates ? 16 : 6}
                    scrollWheelZoom
                    className="relative z-0 h-full w-full"
                  >
                    <TileLayer url={tileLayerUrl} {...tileLayerOptions} />
                    {coordinates && (
                      <Marker
                        icon={locationMarkerIcon}
                        position={coordinates}
                        eventHandlers={{
                          mouseover: openMarkerPopup,
                          mouseout: closeMarkerPopup,
                          click: pinMarkerPopup,
                          popupclose: releaseMarkerPopup,
                        }}
                      >
                        <Popup>
                          จุดที่พบสัตว์จร <br /> {coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}
                        </Popup>
                      </Marker>
                    )}
                    <MapClickHandler onSelect={(latlng) => handleCoordinatesChange(latlng)} />
                  </MapContainer>
                </div>
                <p className="text-xs text-muted-foreground font-prompt">
                  หากไม่อนุญาต GPS สามารถลาก pin เพื่อเลือกตำแหน่งได้เอง หรือพิมพ์พิกัดในช่องสถานที่
                </p>
              </div>
            </section>

            {/* Section 2: Images */}
            <section className="rounded-2xl border border-amber-200 bg-amber-50/40 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-semibold">2</div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-amber-700 font-semibold">ภาพประกอบ</p>
                  <h2 className="text-lg font-bold font-prompt">อัปโหลดภาพน้องหรือจุดเกิดเหตุ</h2>
                  <p className="text-sm text-muted-foreground">ภาพชัดเจนช่วยให้อาสาตรวจสอบได้ไวขึ้น (สูงสุด 5 ภาพ)</p>
                </div>
              </div>
              <MultiImageUpload imageUrls={imageUrls} onImagesChange={setImageUrls} userId={user?.id ?? 'anon'} maxImages={5} />
              <p className="text-xs text-muted-foreground font-prompt">แนะนำให้ถ่ายใกล้ ๆ และมีจุดสังเกต เช่น อาคาร ป้าย ซอย หรือสิ่งที่เห็นได้ชัดเจน</p>
            </section>

            {/* Section 3: Animal info & description */}
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-semibold">3</div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">ข้อมูลสัตว์</p>
                  <h2 className="text-lg font-bold font-prompt">รายละเอียดเพิ่มเติม</h2>
                  <p className="text-sm text-muted-foreground">เลือกแท็กเพื่อบอกลักษณะและสถานะของน้อง</p>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label className="font-prompt">ชนิดสัตว์</Label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setSpecies('dog')} className={`px-3 py-1 rounded-full border transition ${species==='dog'? 'bg-primary text-white border-primary':'bg-white'}`}>หมา</button>
                    <button type="button" onClick={() => setSpecies('cat')} className={`px-3 py-1 rounded-full border transition ${species==='cat'? 'bg-primary text-white border-primary':'bg-white'}`}>แมว</button>
                    <button type="button" onClick={() => setSpecies('other')} className={`px-3 py-1 rounded-full border transition ${species==='other'? 'bg-primary text-white border-primary':'bg-white'}`}>อื่นๆ</button>
                  </div>

                  <Label className="font-prompt">ปลอกคอ</Label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setCollar('yes')} className={`px-3 py-1 rounded-full border transition ${collar==='yes'? 'bg-primary text-white border-primary':'bg-white'}`}>มี</button>
                    <button type="button" onClick={() => setCollar('no')} className={`px-3 py-1 rounded-full border transition ${collar==='no'? 'bg-primary text-white border-primary':'bg-white'}`}>ไม่มี</button>
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="font-prompt">สภาพ</Label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setCondition('normal')} className={`px-3 py-1 rounded-full border transition ${condition==='normal'? 'bg-primary text-white border-primary':'bg-white'}`}>ปกติ</button>
                    <button type="button" onClick={() => setCondition('injured')} className={`px-3 py-1 rounded-full border transition ${condition==='injured'? 'bg-primary text-white border-primary':'bg-white'}`}>บาดเจ็บ/ป่วย</button>
                    <button type="button" onClick={() => setCondition('pregnant')} className={`px-3 py-1 rounded-full border transition ${condition==='pregnant'? 'bg-primary text-white border-primary':'bg-white'}`}>ตั้งครรภ์/ลูกอ่อน</button>
                    <button type="button" onClick={() => setCondition('aggressive')} className={`px-3 py-1 rounded-full border transition ${condition==='aggressive'? 'bg-primary text-white border-primary':'bg-white'}`}>ดุร้าย</button>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="font-prompt">รายละเอียดเพิ่มเติม</Label>
                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="font-prompt" placeholder="เช่น มีลูกติด 3 ตัว หลบอยู่ใต้รถ มีแผลที่ขาหลัง" />
                  </div>
                </div>
              </div>
            </section>

            <Button type="submit" className="w-full font-prompt gap-2 text-base h-12" disabled={createReport.isPending}>
              <Send className="w-4 h-4" />
              {createReport.isPending ? "กำลังส่ง..." : "ส่งรายงานให้ทีมอาสา"}
            </Button>
          </form>
        </Card>

        {reports && reports.length > 0 && (
          <Card className="p-6 shadow-card mb-8 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-prompt">ภาพรวมจาก {reports.length} รายงาน</p>
                <h2 className="text-xl sm:text-2xl font-bold font-prompt">แผนที่จุดพบสัตว์จรล่าสุด</h2>
              </div>
              <Button asChild className={`w-full sm:w-auto gap-2 font-prompt ${mapButtonClass}`}>
                <Link to="/reports/map">
                  <MapIcon className="h-4 w-4" />
                  ดูแผนที่เต็ม
                </Link>
              </Button>
            </div>
            <ReportMapOverview reports={reports} heightClass="h-[300px] sm:h-[380px] lg:h-[420px]" />
          </Card>
        )}

        {reports && reports.length > 0 && (
          <div>
            <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl sm:text-2xl font-bold font-prompt">รายงานล่าสุด</h2>
              <Button asChild variant="ghost" className="w-full sm:w-auto gap-2 font-prompt">
                <Link to="/reports/map">
                  <MapIcon className="h-4 w-4" />
                  ดูทั้งหมดบนแผนที่
                </Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {reports.slice(0, 3).map((report) => (
                <Card key={report.id} className="p-4 shadow-card space-y-3">
                  {report.photo_urls && report.photo_urls.length > 0 ? (
                    <ReportPhotoDialog report={report} />
                  ) : report.latitude && report.longitude ? (
                    <ReportPreviewMap latitude={report.latitude} longitude={report.longitude} />
                  ) : (
                    <div className="rounded-xl border bg-muted/40 p-4 text-sm text-muted-foreground font-prompt">
                      ยังไม่มีการระบุตำแหน่ง
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-1 font-prompt">พบสัตว์จร {report.cat_count} ตัว</h3>
                      <p className="text-sm text-muted-foreground font-prompt">{report.location}</p>
                      {report.latitude && report.longitude && (
                        <a
                          href={`https://www.google.com/maps?q=${report.latitude},${report.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline underline-offset-2 font-prompt"
                        >
                          ดูบน Google Maps (lat {report.latitude.toFixed(3)}, lng {report.longitude.toFixed(3)})
                        </a>
                      )}
                    </div>
                  </div>
                  <Button asChild variant="secondary" className="w-full font-prompt">
                    <Link to={`/reports/map?focus=${report.id}`}>
                      ดูบนแผนที่
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;

const MapClickHandler = ({ onSelect }: { onSelect: (coords: Coordinates) => void }) => {
  useMapEvents({
    click(event) {
      onSelect(event.latlng);
    },
  });
  return null;
};

const ReportPreviewMap = ({ latitude, longitude }: { latitude: number; longitude: number }) => (
  <MapContainer
    key={`${latitude}-${longitude}`}
    center={{ lat: latitude, lng: longitude }}
    zoom={15}
    scrollWheelZoom={false}
    dragging={false}
    doubleClickZoom={false}
    zoomControl={false}
    className="relative z-0 h-36 w-full rounded-2xl"
  >
    <TileLayer url={tileLayerUrl} {...tileLayerOptions} />
    <Marker
      icon={locationMarkerIcon}
      position={{ lat: latitude, lng: longitude }}
      eventHandlers={{
        mouseover: openMarkerPopup,
        mouseout: closeMarkerPopup,
        click: pinMarkerPopup,
        popupclose: releaseMarkerPopup,
      }}
    >
      <Popup>
        พิกัดรายงานล่าสุด<br />lat {latitude.toFixed(5)}, lng {longitude.toFixed(5)}
      </Popup>
    </Marker>
  </MapContainer>
);

const ReportPhotoDialog = ({ report }: { report: ReportType }) => {
  const photoCount = report.photo_urls?.length ?? 0;
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (photoCount === 0 || !report.photo_urls) {
    return null;
  }

  const showPrev = () => {
    setActiveIndex((prev) => (prev - 1 + photoCount) % photoCount);
  };

  const showNext = () => {
    setActiveIndex((prev) => (prev + 1) % photoCount);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setActiveIndex(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="relative h-40 w-full overflow-hidden rounded-2xl border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="ดูภาพทั้งหมด"
        >
          <img
            src={report.photo_urls[0]}
            alt={`ภาพประกอบรายงาน ${report.location}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
            ภาพจากผู้แจ้ง
          </span>
          {photoCount > 1 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-primary">
              ดูทั้งหมด {photoCount} ภาพ
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-prompt">ภาพจากผู้แจ้ง</DialogTitle>
          <DialogDescription className="font-prompt">
            {report.location}
          </DialogDescription>
        </DialogHeader>
        <div className="relative overflow-hidden rounded-2xl border bg-muted">
          <img
            src={report.photo_urls[activeIndex]}
            alt={`ภาพที่ ${activeIndex + 1} ของรายงาน ${report.location}`}
            className="h-full w-full max-h-[60vh] object-contain bg-black"
          />
          {photoCount > 1 && (
            <>
              <button
                type="button"
                onClick={showPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white shadow"
                aria-label="ดูภาพก่อนหน้า"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white shadow"
                aria-label="ดูภาพถัดไป"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                {activeIndex + 1} / {photoCount}
              </span>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
