import type { Metadata } from "next";
import AdoptPageClient from "./AdoptPageClient";

export const metadata: Metadata = {
  title: "หาบ้านให้น้องแมว | Petskub",
  description: "สำรวจสัตว์เลี้ยงที่กำลังมองหาบ้านใหม่ พร้อมตัวกรองและรายละเอียดการติดต่อ",
};

const AdoptPage = () => {
  return (
    <div className="min-h-screen bg-surface-sand/60 pb-16 pt-10">
      <div className="container mx-auto px-4">
        <div className="mb-10 text-center">
          <p className="font-prompt text-sm uppercase tracking-[0.3em] text-primary/70">adopt me</p>
          <h1 className="mt-2 font-heading text-4xl font-bold text-foreground">
            หาบ้านให้เพื่อนใหม่ของคุณ
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground font-prompt">
            เลือกน้องที่ถูกใจจากประกาศล่าสุด ดูรายละเอียด ติดต่อเจ้าของ และช่วยแชร์ให้สัตว์จรได้บ้านที่อบอุ่น
          </p>
        </div>
        <AdoptPageClient />
      </div>
    </div>
  );
};

export default AdoptPage;
