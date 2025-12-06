import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const articles = [
  {
    title: "คู่มือดูแลแมวหลังทำหมัน",
    summary: "เช็กอาการผิดปกติ วิธีทำความสะอาดแผล และอาหารที่เหมาะสม",
    readingTime: "5 นาที",
  },
  {
    title: "เตรียมบ้านรับสัตว์เลี้ยงใหม่",
    summary: "ตรวจเช็กของใช้จำเป็นและพื้นที่ปลอดภัยก่อนน้องย้ายบ้าน",
    readingTime: "4 นาที",
  },
  {
    title: "First Aid สำหรับแมวจร",
    summary: "เรียนรู้วิธีประเมินอาการเบื้องต้นก่อนพาไปหาหมอ",
    readingTime: "6 นาที",
  },
];

export const metadata: Metadata = {
  title: "คลังความรู้ | Petskub",
  description: "บทความและคำแนะนำด้านการดูแลสัตว์เลี้ยงสำหรับอาสาและผู้เริ่มต้น",
};

const KnowledgePage = () => {
  return (
    <div className="min-h-screen bg-surface-mint/40 pb-20 pt-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="font-prompt text-xs uppercase tracking-[0.4em] text-mint">knowledge base</p>
          <h1 className="mt-3 font-heading text-4xl font-bold text-foreground">คลังความรู้</h1>
          <p className="mt-4 text-base text-muted-foreground font-prompt">
            สรุปสิ่งที่อาสาต้องรู้ ตั้งแต่วิธีดูแลสัตว์ป่วยจนถึงแนวทางการรับอุปถัมภ์ที่ถูกต้อง
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {articles.map((article) => (
            <Card key={article.title} className="rounded-[28px] border border-mint/30 bg-white p-6 shadow-soft">
              <p className="text-xs font-semibold text-mint">{article.readingTime}</p>
              <h2 className="mt-2 font-heading text-xl font-bold text-foreground">{article.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground font-prompt">{article.summary}</p>
              <Button variant="ghost" className="mt-4 w-fit px-0 font-prompt text-primary">อ่านเพิ่มเติม →</Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KnowledgePage;
