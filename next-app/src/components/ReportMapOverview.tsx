"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import L, { type Map as LeafletMap, type Marker as LeafletMarker } from "leaflet";
import type { Report } from "@shared/hooks/useReports";
import {
  locationMarkerIcon,
  defaultMapCenter,
  tileLayerUrl,
  tileLayerOptions,
  openMarkerPopup,
  closeMarkerPopup,
  pinMarkerPopup,
  releaseMarkerPopup,
} from "@/lib/leaflet";

interface ReportMapOverviewProps {
  reports?: Report[];
  heightClass?: string;
  limit?: number;
  scrollWheelZoom?: boolean;
}

const ReportMapOverview = ({
  reports,
  heightClass = "h-[280px] sm:h-[360px] lg:h-[420px]",
  limit,
  scrollWheelZoom = true,
}: ReportMapOverviewProps) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const [isClientReady, setIsClientReady] = useState(false);
  const points = useMemo(
    () =>
      (reports ?? [])
        .filter((report): report is Report & { latitude: number; longitude: number } =>
          typeof report.latitude === "number" && typeof report.longitude === "number"
        )
        .slice(0, typeof limit === "number" ? limit : undefined),
    [reports, limit]
  );
  const hasPoints = points.length > 0;

  const center = useMemo(() => {
    if (!hasPoints) return defaultMapCenter;
    const first = points[0];
    return { lat: first.latitude, lng: first.longitude };
  }, [hasPoints, points]);
  const zoomLevel = hasPoints && points.length > 5 ? 11 : 14;

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      marker.off("mouseover", openMarkerPopup);
      marker.off("mouseout", closeMarkerPopup);
      marker.off("click", pinMarkerPopup);
      marker.off("popupclose", releaseMarkerPopup);
      marker.remove();
    });
    markersRef.current = [];
  }, []);

  useEffect(() => {
    setIsClientReady(true);
    return () => {
      clearMarkers();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [clearMarkers]);

  useEffect(() => {
    if (!isClientReady || mapRef.current || !mapContainerRef.current || !hasPoints) {
      return;
    }

    const map = L.map(mapContainerRef.current, {
      center: center ?? defaultMapCenter,
      zoom: zoomLevel,
      scrollWheelZoom,
    });

    L.tileLayer(tileLayerUrl, tileLayerOptions).addTo(map);
    mapRef.current = map;
  }, [center.lat, center.lng, hasPoints, isClientReady, scrollWheelZoom, zoomLevel]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (scrollWheelZoom) {
      mapRef.current.scrollWheelZoom.enable();
    } else {
      mapRef.current.scrollWheelZoom.disable();
    }
  }, [scrollWheelZoom]);

  useEffect(() => {
    if (!mapRef.current || !hasPoints) return;
    mapRef.current.setView(center ?? defaultMapCenter, zoomLevel);
  }, [center.lat, center.lng, hasPoints, zoomLevel]);

  useEffect(() => {
    if (!mapRef.current || !hasPoints) {
      clearMarkers();
      return;
    }

    clearMarkers();
    markersRef.current = points.map((report) => {
      const marker = L.marker({ lat: report.latitude!, lng: report.longitude! }, {
        icon: locationMarkerIcon,
      });

      marker.on("mouseover", openMarkerPopup);
      marker.on("mouseout", closeMarkerPopup);
      marker.on("click", pinMarkerPopup);
      marker.on("popupclose", releaseMarkerPopup);

      const popupContent = buildPopupHtml(report);
      marker.bindPopup(popupContent);
      marker.addTo(mapRef.current!);
      return marker;
    });

    return () => {
      clearMarkers();
    };
  }, [points, hasPoints, clearMarkers]);

  if (!isClientReady) {
    return (
      <div className={`relative w-full rounded-3xl bg-muted/40 ${heightClass}`}>
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-muted/20" />
      </div>
    );
  }

  if (!hasPoints) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-3xl border bg-muted/40 text-center">
        <p className="font-semibold font-prompt">ยังไม่มีพิกัดสำหรับแสดงผล</p>
        <p className="text-sm text-muted-foreground font-prompt">เริ่มแจ้งจุดพบสัตว์จรเพื่อดูแผนที่ภาพรวม</p>
      </div>
    );
  }

  return (
    <div className={`relative z-0 w-full rounded-3xl ${heightClass}`}>
      <div ref={mapContainerRef} className="leaflet-container h-full w-full rounded-3xl" />
    </div>
  );
};

export default memo(ReportMapOverview);

const buildGoogleMapsUrl = (report: Report): string | null => {
  if (typeof report.latitude === "number" && typeof report.longitude === "number") {
    return `https://www.google.com/maps?q=${report.latitude},${report.longitude}`;
  }

  if (report.location) {
    const query = encodeURIComponent(`${report.location} ${report.district ?? ""} ${report.province ?? ""}`.trim());
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }

  return null;
};

const buildPopupHtml = (report: Report) => {
  const location = escapeHtml(report.location ?? "ไม่ระบุสถานที่");
  const province = escapeHtml(report.province ?? "ไม่ระบุจังหวัด");
  const district = escapeHtml(report.district ?? "ไม่ระบุอำเภอ");
  const lat = typeof report.latitude === "number" ? report.latitude.toFixed(3) : "-";
  const lng = typeof report.longitude === "number" ? report.longitude.toFixed(3) : "-";
  const mapUrl = buildGoogleMapsUrl(report);

  const linkHtml = mapUrl
    ? `<a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="block text-xs font-semibold text-primary hover:underline">เปิด Google Maps</a>`
    : "";

  return `
    <div class="space-y-1 font-prompt">
      <p class="text-sm font-semibold">${location}</p>
      <p class="text-xs text-muted-foreground">${province} · ${district}</p>
      <p class="text-xs text-muted-foreground">lat ${lat}, lng ${lng}</p>
      ${linkHtml}
    </div>
  `;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) =>
    ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[char] ?? char)
  );
