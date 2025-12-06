import type { Metadata } from "next";
import ReportPageClient from "./ReportPageClient";

export const metadata: Metadata = {
  title: "แจ้งจุดพบสัตว์จร | Petskub",
  description: "ดูภาพรวมรายงานบนแผนที่และแจ้งพิกัดใหม่เพื่อขอความช่วยเหลือ",
};

const ReportPage = () => {
  return (
    <div className="min-h-screen bg-surface-lilac/40 pb-16 pt-10">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <p className="font-prompt text-sm uppercase tracking-[0.3em] text-lilac/80">report & rescue</p>
          <h1 className="mt-2 font-heading text-4xl font-bold text-foreground">
            แจ้งจุดพบสัตว์จร
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground font-prompt">
            แผนที่อินเทอร์แอคทีฟรวมรายงานล่าสุดจากชุมชน พร้อมช่องทางแจ้งพิกัดใหม่เพื่อส่งต่อให้ทีมอาสา
          </p>
        </div>
        <ReportPageClient />
      </div>
    </div>
  );
};

export default ReportPage;
