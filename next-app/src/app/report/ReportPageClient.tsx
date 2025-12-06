"use client";

import Link from "next/link";
import { Loader2, MapPin, RefreshCw } from "lucide-react";
import { useReports } from "@/shared/hooks/useReports";
import ReportMapOverview from "@/components/ReportMapOverview";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const ReportPageClient = () => {
  const { data: reports, isLoading, isError, error, refetch, isFetching } = useReports();

  const activeReports = reports?.filter((report) => report.status !== "resolved") ?? [];

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-heading text-2xl font-bold text-foreground">ภาพรวมพิกัดล่าสุด</h2>
            <p className="mt-1 text-sm text-muted-foreground font-prompt">
              ดึงข้อมูลจากอาสาสมัครทั่วประเทศ อัปเดตทุกไม่กี่นาที
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-4 py-2 font-prompt">
              ทั้งหมด {reports?.length ?? 0} จุด
            </Badge>
            <Badge className="rounded-full bg-success/10 text-success">รอดำเนินการ {activeReports.length}</Badge>
            <Button type="button" variant="outline" className="gap-2 font-prompt" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} /> รีเฟรช
            </Button>
          </div>
        </div>

        {isError && (
          <Alert variant="destructive" className="mt-6">
            <AlertDescription className="font-prompt">
              {(error as Error)?.message || "เกิดข้อผิดพลาดระหว่างโหลดข้อมูล"}
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="flex flex-col items-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-prompt">กำลังโหลดแผนที่...</p>
          </div>
        )}

        {!isLoading && reports && reports.length > 0 && (
          <div className="mt-6">
            <ReportMapOverview reports={reports} heightClass="h-[360px]" scrollWheelZoom={false} />
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="rounded-[28px] border border-primary/10 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-muted-foreground font-prompt">แจ้งพิกัดผ่านเว็บไซต์</p>
              <p className="text-lg font-bold text-foreground font-prompt"><span className="text-primary">5</span> นาที</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground font-prompt">
            กรอกข้อมูลพื้นที่ รูปภาพ และเบอร์ติดต่อ ทีมงานจะตรวจสอบอย่างรวดเร็ว
          </p>
          <Button asChild className="mt-4 w-full gap-2 rounded-2xl font-prompt">
            <Link href="/login">เริ่มแจ้งพิกัด</Link>
          </Button>
        </Card>

        <Card className="rounded-[28px] border border-success/10 bg-gradient-to-br from-white via-success/5 to-white p-6 shadow-soft">
          <h3 className="font-heading text-xl font-bold text-foreground">ช่องทางเร่งด่วน</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground font-prompt">
            <li>• LINE OpenChat: <span className="font-semibold text-foreground">@petskub-rescue</span></li>
            <li>• โทร 24 ชม.: <span className="font-semibold text-foreground">090-XXX-XXXX</span></li>
            <li>• ส่งพิกัดด่วน: <span className="font-semibold text-foreground">rescue@petskub.com</span></li>
          </ul>
          <p className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-xs text-muted-foreground">
            โปรดระบุจุดสังเกตและจำนวนสัตว์ เพื่อให้ทีมสามารถเตรียมอุปกรณ์ได้ตรงจุด
          </p>
        </Card>

        <Card className="rounded-[28px] border border-lilac/20 bg-white p-6 shadow-soft">
          <h3 className="font-heading text-xl font-bold text-foreground">สถานะการดำเนินงาน</h3>
          <div className="mt-4 space-y-3 font-prompt text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">รอทีมภาคสนาม</span>
              <Badge variant="outline" className="rounded-full border-amber-200 text-amber-500">{activeReports.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">กำลังติดตาม</span>
              <Badge variant="outline" className="rounded-full border-primary/30 text-primary">
                {reports?.filter((report) => report.status === "in_progress").length ?? 0}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">ปิดเคสแล้ว</span>
              <Badge variant="outline" className="rounded-full border-success/30 text-success">
                {reports?.filter((report) => report.status === "resolved").length ?? 0}
              </Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ReportPageClient;
