import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  PlusCircle,
  Search,
  LocateFixed,
  ClipboardList,
  Clock3,
  Radar,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
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
import type { Coordinates } from "@/lib/leaflet";
import {
  REPORT_STATUS_LABELS,
  useReports,
  useUpdateReportStatus,
  type Report,
} from "@shared/hooks/useReports";
import { useAuth } from "@/hooks/useAuth";

const REPORT_THUMBNAIL_PLACEHOLDER =
  "https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=600&q=70";

const statusConfig: Record<
  Report["status"],
  {
    label: string;
    bubble: string;
    chip: string;
    icon: React.ReactNode;
  }
> = {
  pending: {
    label: REPORT_STATUS_LABELS.pending,
    bubble:
      "bg-gradient-to-br from-amber-50 to-white border border-amber-100 text-amber-600 shadow-inner",
    chip:
      "bg-gradient-to-r from-amber-100/90 to-white text-amber-700 border border-amber-200 shadow-sm",
    icon: <Clock3 className="h-4 w-4" />,
  },
  in_progress: {
    label: REPORT_STATUS_LABELS.in_progress,
    bubble:
      "bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 text-emerald-600 shadow-inner",
    chip:
      "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm",
    icon: <Radar className="h-4 w-4" />,
  },
  resolved: {
    label: REPORT_STATUS_LABELS.resolved,
    bubble:
      "bg-gradient-to-br from-fuchsia-50 to-white border border-fuchsia-100 text-fuchsia-600 shadow-inner",
    chip:
      "bg-gradient-to-r from-fuchsia-50 to-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 shadow-sm",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
};

const statusDescriptions: Record<Report["status"], string> = {
  pending: "รออาสาสมัครหรือสมาชิกช่วยรับเคส",
  in_progress: "สมาชิกกำลังติดตามและดูแลเคสนี้",
  resolved: "ปิดรายงานแล้วหลังดูแลเสร็จสิ้น",
};

const statusFilters: (
  | { value: "all"; label: string }
  | { value: Report["status"]; label: string }
)[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "pending", label: statusConfig.pending.label },
  { value: "in_progress", label: statusConfig.in_progress.label },
  { value: "resolved", label: statusConfig.resolved.label },
];

const pickPhotoSource = (value: unknown): string | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const found = value.find(
      (src) => typeof src === "string" && src.trim().length > 0
    );
    return found ?? null;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
};

const resolveReportImage = (
  value: Report["photo_urls"]
): { src: string; isPlaceholder: boolean } => {
  const chosen = pickPhotoSource(value);
  if (chosen) return { src: chosen, isPlaceholder: false };
  return { src: REPORT_THUMBNAIL_PLACEHOLDER, isPlaceholder: true };
};

const ReportMap = () => {
  const { data: reports, isLoading } = useReports();
  const [searchParams] = useSearchParams();
  const focusParam = searchParams.get("focus");
  const { user, loading: authLoading } = useAuth();
  const canManageStatus = Boolean(user) && !authLoading;
  const { mutate: updateReportStatus } = useUpdateReportStatus();

  const [activeReportId, setActiveReportId] = useState<string | null>(
    focusParam
  );
  const [statusFilter, setStatusFilter] = useState<
    Report["status"] | "all"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusUpdateTarget, setStatusUpdateTarget] = useState<
    { id: string; status: Report["status"] } | null
  >(null);

  const handleStatusChange = useCallback(
    (reportId: string, nextStatus: Report["status"]) => {
      setStatusUpdateTarget({ id: reportId, status: nextStatus });
      updateReportStatus(
        { id: reportId, status: nextStatus },
        {
          onSettled: () => setStatusUpdateTarget(null),
        }
      );
    },
    [updateReportStatus]
  );

  const reportsWithCoordinates = useMemo(
    () =>
      (reports ?? []).filter(
        (r): r is Report & { latitude: number; longitude: number } =>
          typeof r.latitude === "number" && typeof r.longitude === "number"
      ),
    [reports]
  );

  const statusSummary = useMemo(() => {
    const summary = {
      total: reports?.length ?? 0,
      pending: 0,
      in_progress: 0,
      resolved: 0,
    };
    (reports ?? []).forEach((r) => {
      summary[r.status] += 1;
    });
    return summary;
  }, [reports]);

  const filteredReports = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return (reports ?? []).filter((r) => {
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const searchable = `${r.location ?? ""} ${r.district ?? ""} ${
        r.province ?? ""
      }`.toLowerCase();
      const matchesSearch = !normalized || searchable.includes(normalized);
      return matchesStatus && matchesSearch;
    });
  }, [reports, statusFilter, searchTerm]);

  const filteredReportsWithCoordinates = useMemo(
    () =>
      filteredReports.filter(
        (r): r is Report & { latitude: number; longitude: number } =>
          typeof r.latitude === "number" && typeof r.longitude === "number"
      ),
    [filteredReports]
  );

  useEffect(() => {
    if (!focusParam) return;
    const exists = reportsWithCoordinates.some((r) => r.id === focusParam);
    if (exists) setActiveReportId(focusParam);
  }, [focusParam, reportsWithCoordinates]);

  useEffect(() => {
    if (filteredReportsWithCoordinates.length === 0) {
      if (activeReportId !== null) setActiveReportId(null);
      return;
    }
    const activeExists = filteredReportsWithCoordinates.some(
      (r) => r.id === activeReportId
    );
    if (!activeExists)
      setActiveReportId(filteredReportsWithCoordinates[0].id);
  }, [filteredReportsWithCoordinates, activeReportId]);

  const activeReport =
    filteredReportsWithCoordinates.find((r) => r.id === activeReportId) ??
    filteredReportsWithCoordinates[0] ??
    null;

  const showEmptyState = !isLoading && reportsWithCoordinates.length === 0;
  const showFilteredEmptyState =
    !isLoading &&
    reportsWithCoordinates.length > 0 &&
    filteredReportsWithCoordinates.length === 0;

  return (
    <div className="container mx-auto px-4 pb-14 space-y-6 sm:space-y-8">
      {/* HERO / HEADER */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-white via-surface-sand/80 to-surface-mint/70 shadow-soft rounded-3xl">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.9),transparent_60%)]" />
        <div className="relative p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm uppercase tracking-widest text-sunrise font-nav">
              รายงานสัตว์จร
            </p>
            <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-sunrise drop-shadow-sm mt-1">
              แผนที่รายงานทั้งหมด
            </h1>
            <p className="text-sm sm:text-base text-primary/70 font-nav mt-2">
              ดูจุดที่พบแมวและสุนัขจร พร้อมติดตามสถานะแบบเรียลไทม์
            </p>

            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-nav border border-white/70 shadow-sm">
              <ClipboardList className="h-4 w-4 text-sunrise" />
              <span className="font-semibold text-sunrise">
                {filteredReports.length} รายการ
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              className="gap-2 font-nav rounded-full bg-sunrise/95 text-white shadow-md hover:bg-sunrise/90 px-5 ring-1 ring-sunrise/30"
            >
              <Link to="/report">
                <PlusCircle className="h-4 w-4" />
                แจ้งรายงานใหม่
              </Link>
            </Button>

            {!showEmptyState && !showFilteredEmptyState && activeReport && (
              <Button
                size="sm"
                variant="outline"
                className="font-nav rounded-full border-primary/50 bg-white text-primary shadow-sm hover:bg-white/90 hover:shadow-md"
                onClick={() => setActiveReportId(activeReport.id)}
              >
                <LocateFixed className="h-4 w-4 mr-1" />
                โฟกัสพิกัด
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* STATS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="รายงานทั้งหมด"
          value={statusSummary.total}
          tone="sunrise"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard
          title={statusConfig.pending.label}
          value={statusSummary.pending}
          tone="sunrise"
          icon={statusConfig.pending.icon}
        />
        <StatCard
          title={statusConfig.in_progress.label}
          value={statusSummary.in_progress}
          tone="mint"
          icon={statusConfig.in_progress.icon}
        />
        <StatCard
          title={statusConfig.resolved.label}
          value={statusSummary.resolved}
          tone="lilac"
          icon={statusConfig.resolved.icon}
        />
      </div>

      {/* FILTER BAR (sticky) */}
      <div className="sticky top-2 z-20 rounded-2xl border border-white/70 bg-white/80 backdrop-blur shadow-soft p-3 sm:p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {statusFilters.map((filter) => {
            const active = statusFilter === filter.value;
            return (
              <Button
                key={filter.value}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                className={[
                  "font-nav rounded-full px-4 border-2 transition-all",
                  active
                    ? "bg-primary text-white border-primary shadow-md ring-1 ring-primary/30"
                    : "bg-white text-primary/90 border-primary/30 hover:bg-primary/10 hover:text-primary",
                ].join(" ")}
                onClick={() =>
                  setStatusFilter(filter.value as Report["status"] | "all")
                }
              >
                {filter.label}
              </Button>
            );
          })}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาตามตำแหน่ง / อำเภอ / จังหวัด"
              className="pl-9 font-nav bg-white rounded-full border-primary/20 focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {(statusFilter !== "all" || searchTerm) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="font-nav rounded-full text-primary/90 hover:bg-primary/20"
              onClick={() => {
                setStatusFilter("all");
                setSearchTerm("");
              }}
            >
              ล้างตัวกรอง
            </Button>
          )}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-[1.2fr,0.85fr]">
        {/* MAP */}
        <Card className="border-0 shadow-soft rounded-3xl bg-gradient-to-b from-white via-surface-sand/70 to-surface-mint/60 p-3 sm:p-4">
          {showEmptyState ? (
            <EmptyMapState
              title="ยังไม่มีพิกัดสำหรับแสดง"
              subtitle="เริ่มแจ้งรายงานสัตว์จรเพื่อให้ขึ้นบนแผนที่"
            />
          ) : showFilteredEmptyState ? (
            <EmptyMapState
              title="ไม่มีผลลัพธ์ที่ตรงกับตัวกรอง"
              subtitle="ลองเปลี่ยนสถานะหรือค้นหาคำอื่นดูนะ"
            />
          ) : (
            <div className="h-[520px] rounded-[1.75rem] border border-white/70 bg-white/90 shadow-inner overflow-hidden relative">
              {/* legend */}
              <div className="absolute right-3 top-3 z-[1000] rounded-xl bg-white/90 border border-primary/10 p-2 text-xs font-nav shadow">
                <div className="flex items-center gap-2 text-sunrise">
                  <span className="h-2 w-2 rounded-full bg-sunrise" />
                  รอดำเนินการ
                </div>
                <div className="flex items-center gap-2 text-mint mt-1">
                  <span className="h-2 w-2 rounded-full bg-mint" />
                  กำลังติดตาม
                </div>
                <div className="flex items-center gap-2 text-lilac mt-1">
                  <span className="h-2 w-2 rounded-full bg-lilac" />
                  ปิดรายงาน
                </div>
              </div>

              <MapContainer
                center={
                  activeReport
                    ? { lat: activeReport.latitude, lng: activeReport.longitude }
                    : defaultMapCenter
                }
                zoom={activeReport ? 15 : 6}
                scrollWheelZoom
                className="relative z-0 h-full w-full"
              >
                <TileLayer url={tileLayerUrl} {...tileLayerOptions} />
                <MapFocus
                  coordinates={
                    activeReport
                      ? {
                          lat: activeReport.latitude,
                          lng: activeReport.longitude,
                        }
                      : null
                  }
                />

                {reportsWithCoordinates.map((report) => (
                  <Marker
                    key={report.id}
                    icon={locationMarkerIcon}
                    position={{ lat: report.latitude, lng: report.longitude }}
                    eventHandlers={{
                      click: (event) => {
                        pinMarkerPopup(event);
                        setActiveReportId(report.id);
                      },
                      mouseover: openMarkerPopup,
                      mouseout: closeMarkerPopup,
                      popupclose: releaseMarkerPopup,
                    }}
                  >
                    <Popup>
                      <div className="space-y-1 font-prompt">
                        <p className="text-sm font-semibold">
                          {report.location}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {report.province} · {report.district}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          lat {report.latitude.toFixed(4)}, lng{" "}
                          {report.longitude.toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          รายงานเมื่อ{" "}
                          {new Date(report.created_at).toLocaleString("th-TH")}
                        </p>
                        {getGoogleMapsUrl(report) && (
                          <Button
                            asChild
                            variant="link"
                            size="sm"
                            className="px-0 text-xs"
                          >
                            <a
                              href={getGoogleMapsUrl(report) ?? "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              เปิด Google Maps
                            </a>
                          </Button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          )}
        </Card>

        {/* LIST */}
        <Card className="border-0 shadow-card rounded-3xl bg-gradient-to-br from-white via-surface-sand/80 to-surface-mint/60 overflow-hidden">
          <div className="flex items-center justify-between border-b border-primary/10 px-5 py-4 bg-white/80">
            <div>
              <h2 className="text-2xl font-bold font-heading text-primary">
                รายการรายงาน
              </h2>
              <p className="text-sm font-nav text-primary/70">
                {filteredReports.length
                  ? `${filteredReports.length} รายการที่ตรงกับตัวกรอง`
                  : isLoading
                  ? "กำลังโหลด..."
                  : "ไม่มีผลลัพธ์"}
              </p>
            </div>

            {!showEmptyState && !showFilteredEmptyState && activeReport && (
              <Button
                size="sm"
                variant="outline"
                className="font-nav text-primary border-primary/50 hover:bg-primary/20 rounded-full shadow-sm"
                onClick={() => setActiveReportId(activeReport.id)}
              >
                โฟกัสพิกัด
              </Button>
            )}
          </div>

          <ScrollArea className="max-h-[520px] px-4 sm:px-5 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/40 scrollbar-track-white/30">
            <div className="space-y-3 py-4">
              {isLoading && (
                <>
                  <ListSkeleton />
                  <ListSkeleton />
                  <ListSkeleton />
                </>
              )}

              {!isLoading && filteredReports.length === 0 && (
                <div className="rounded-2xl border border-dashed border-primary/20 p-6 text-center bg-white/80">
                  <p className="font-semibold font-nav text-primary">
                    ไม่มีรายการที่แสดง
                  </p>
                  <p className="text-sm font-nav text-primary/60">
                    ลองแก้ไขตัวกรองหรือเพิ่มรายงานใหม่
                  </p>
                </div>
              )}

              {filteredReports.map((report) => {
                const status = statusConfig[report.status];
                const isActive = report.id === activeReportId;
                const googleMapsUrl = getGoogleMapsUrl(report);
                const isUpdatingThisReport =
                  statusUpdateTarget?.id === report.id;
                const thumbnail = resolveReportImage(report.photo_urls);

                return (
                  <div
                    key={report.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    onClick={() => setActiveReportId(report.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveReportId(report.id);
                      }
                    }}
                    className={[
                      "w-full text-left rounded-3xl border p-5 shadow-sm transition-all duration-300 backdrop-blur-sm",
                      "hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary/30",
                      isActive
                        ? "border-transparent bg-gradient-to-br from-white via-sunrise/15 to-mint/10 shadow-lg ring-1 ring-sunrise/30"
                        : "border-white/70 bg-white/95",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-5">
                      <div className="flex flex-1 items-start gap-3">
                        <div
                          className={[
                            "mt-1 h-10 w-10 rounded-xl grid place-items-center border",
                            status.bubble,
                          ].join(" ")}
                        >
                          {status.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-0.5 min-w-0">
                              <p className="text-[13px] font-semibold font-nav uppercase tracking-[0.08em] text-sunrise/70 whitespace-normal break-words">
                                {report.province} · {report.district}
                              </p>
                              <h3 className="text-xl font-black font-heading text-primary whitespace-normal break-words leading-tight line-clamp-2">
                                {report.location}
                              </h3>
                              <p className="text-[13px] font-nav text-foreground/60">
                                {new Date(report.created_at).toLocaleString(
                                  "th-TH"
                                )}
                              </p>
                            </div>

                            <span
                              className={[
                                "inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[13px] font-semibold border shrink-0 shadow-sm uppercase tracking-wide",
                                status.chip,
                              ].join(" ")}
                            >
                              {status.label}
                            </span>
                          </div>

                          <p className="mt-3 text-[15px] leading-relaxed font-nav text-primary/80 line-clamp-3">
                            {report.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                          </p>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-nav">
                            <div className="flex items-center gap-2 text-primary/70">
                              <MapPin className="h-4 w-4" />
                              <span className="font-semibold">
                                พบสัตว์จร {report.cat_count} ตัว
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              {typeof report.latitude === "number" &&
                              typeof report.longitude === "number" ? (
                                <span className="text-[13px] font-semibold text-primary/80 underline underline-offset-4">
                                  ดูบนแผนที่
                                </span>
                              ) : (
                                <span className="text-[13px] text-foreground/40 italic">
                                  ยังไม่ระบุพิกัด
                                </span>
                              )}

                              {googleMapsUrl && (
                                <a
                                  href={googleMapsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[13px] font-semibold text-primary hover:text-primary/80 underline underline-offset-4"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  เปิดใน Google Maps
                                </a>
                              )}
                            </div>
                          </div>

                          {canManageStatus && (
                            <div className="mt-4 rounded-2xl border border-white/60 bg-gradient-to-r from-white via-sunrise/5 to-mint/5 p-4 shadow-inner">
                              <div className="flex flex-col gap-1 text-xs font-nav text-primary/70">
                                <span className="font-semibold uppercase tracking-wide text-primary">
                                  สมาชิกจัดการสถานะ
                                </span>
                                <span>
                                  ปรับเป็น "{statusConfig.in_progress.label}" หรือ "{statusConfig.resolved.label}"
                                </span>
                              </div>
                              <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="rounded-full bg-gradient-to-r from-primary to-sunrise text-white shadow-md"
                                      disabled={isUpdatingThisReport}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {isUpdatingThisReport ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          กำลังบันทึก...
                                        </>
                                      ) : (
                                        "อัปเดตสถานะ"
                                      )}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    className="w-72 rounded-2xl border border-white/60 bg-white/95 shadow-xl"
                                  >
                                    <DropdownMenuLabel className="font-nav text-xs uppercase tracking-[0.14em] text-primary/70">
                                      เลือกสถานะใหม่
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {(Object.keys(statusConfig) as Report["status"][]).map(
                                      (statusKey) => {
                                        const option = statusConfig[statusKey];
                                        const disabledOption =
                                          report.status === statusKey ||
                                          isUpdatingThisReport;
                                        return (
                                          <DropdownMenuItem
                                            key={statusKey}
                                            disabled={disabledOption}
                                            className="flex items-start gap-3 py-2 font-nav"
                                            onClick={(event) => {
                                              event.stopPropagation();
                                              handleStatusChange(
                                                report.id,
                                                statusKey
                                              );
                                            }}
                                          >
                                            <div
                                              className={[
                                                "mt-0.5 h-9 w-9 rounded-2xl border flex items-center justify-center",
                                                option.bubble,
                                              ].join(" ")}
                                            >
                                              {option.icon}
                                            </div>
                                            <div className="flex flex-col text-left">
                                              <span className="text-sm font-semibold text-primary">
                                                {option.label}
                                              </span>
                                              <span className="text-xs text-muted-foreground">
                                                {statusDescriptions[statusKey]}
                                              </span>
                                              {report.status === statusKey && (
                                                <span className="text-[10px] text-mint font-semibold">
                                                  สถานะปัจจุบัน
                                                </span>
                                              )}
                                            </div>
                                          </DropdownMenuItem>
                                        );
                                      }
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>

                                <div className="flex items-center gap-2 text-[12px] text-primary/70">
                                  <span className="uppercase tracking-wide">สถานะปัจจุบัน</span>
                                  <span
                                    className={[
                                      "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold border",
                                      status.chip,
                                    ].join(" ")}
                                  >
                                    {status.label}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border border-white/80 bg-white/70 shadow-inner overflow-hidden relative">
                        <img
                          src={thumbnail.src}
                          alt={report.location || "report thumbnail"}
                          loading="lazy"
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        {thumbnail.isPlaceholder && (
                          <span className="absolute bottom-1 right-1 rounded-full bg-white/85 px-2 text-[10px] font-semibold text-primary shadow">
                            ไม่มีภาพ
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
};

export default ReportMap;

/* ------------------------- helpers ------------------------- */

const MapFocus = ({ coordinates }: { coordinates: Coordinates | null }) => {
  const map = useMap();
  useEffect(() => {
    if (coordinates) map.setView(coordinates, 15, { animate: true });
  }, [coordinates, map]);
  return null;
};

const getGoogleMapsUrl = (report: Report): string | null => {
  if (
    typeof report.latitude === "number" &&
    typeof report.longitude === "number"
  ) {
    return `https://www.google.com/maps?q=${report.latitude},${report.longitude}`;
  }
  if (report.location) {
    const query = encodeURIComponent(
      `${report.location} ${report.district ?? ""} ${
        report.province ?? ""
      }`.trim()
    );
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
  return null;
};

/* ------------------------- UI bits ------------------------- */

function StatCard({
  title,
  value,
  tone,
  icon,
}: {
  title: string;
  value: number;
  tone: "sunrise" | "mint" | "lilac";
  icon: React.ReactNode;
}) {
  const toneMap = {
    sunrise: "from-sunrise/15 to-white text-sunrise",
    mint: "from-mint/15 to-white text-mint",
    lilac: "from-lilac/15 to-white text-lilac",
  }[tone];

  return (
    <Card
      className={[
        "p-4 border-0 rounded-2xl shadow-soft bg-gradient-to-br",
        toneMap,
      ].join(" ")}
    >
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-white/80 border border-white/70 grid place-items-center shadow-sm">
          {icon}
        </div>
        <div>
          <p className="text-sm font-nav text-foreground/80">{title}</p>
          <p className="text-3xl font-extrabold font-heading drop-shadow-sm">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function EmptyMapState({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="h-[520px] flex flex-col items-center justify-center gap-2 text-center rounded-2xl bg-white/70 border border-dashed border-primary/20">
      <MapPin className="h-10 w-10 text-muted-foreground" />
      <p className="font-semibold font-prompt">{title}</p>
      <p className="text-sm text-muted-foreground font-prompt">{subtitle}</p>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-xl bg-muted/40" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-2/3 bg-muted/40 rounded" />
          <div className="h-4 w-1/2 bg-muted/40 rounded" />
          <div className="h-3 w-1/3 bg-muted/40 rounded" />
          <div className="h-3 w-full bg-muted/30 rounded" />
        </div>
      </div>
    </div>
  );
}
