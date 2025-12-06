import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const stories = [
  {
    title: "พลอย & เจ้าถ่าน",
    location: "กรุงเทพฯ",
    summary: "เจ้าเหมียวถ่านเคยเป็นแมวจรถูกทำร้าย ก่อนจะได้พบครอบครัวใหม่ที่ดูแลเหมือนลูก",
    tags: ["ฟื้นฟูสุขภาพ", "รักแรกพบ"],
  },
  {
    title: "บ้านอุ่นรัก",
    location: "เชียงใหม่",
    summary: "รับน้องเหมียวสามพี่น้องไปเลี้ยงพร้อมกัน เพราะไม่อยากให้ต้องพรากจากกัน",
    tags: ["รับเลี้ยงหลายตัว", "ครอบครัว"]
  },
  {
    title: "ทีมหมออาสา",
    location: "ขอนแก่น",
    summary: "ทีมอาสาช่วยรักษาและหาบ้านให้น้องที่ถูกรถชนจนเดินไม่ได้ ปัจจุบันกลับมาวิ่งเล่นได้แล้ว",
    tags: ["ทีมอาสา", "การแพทย์"],
  },
];

export const metadata: Metadata = {
  title: "เรื่องราวความสำเร็จ | Petskub",
  description: "แรงบันดาลใจจากคนที่เคยรับเลี้ยงสัตว์จรและทำให้ชีวิตของพวกเขาดีขึ้น",
};

const SuccessStoriesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-surface-warm/60 pb-20 pt-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-prompt text-xs uppercase tracking-[0.4em] text-primary/70">community love</p>
          <h1 className="mt-3 font-heading text-4xl font-bold text-foreground">เรื่องราวที่ทำให้ยิ้ม</h1>
          <p className="mt-4 text-base text-muted-foreground font-prompt">
            ทุกการรับเลี้ยงคือจุดเริ่มต้นของชีวิตใหม่ แรงบันดาลใจเหล่านี้มาจากผู้ใช้งาน Petskub ที่อยากขอบคุณชุมชน
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {stories.map((story) => (
            <Card key={story.title} className="rounded-[28px] border border-primary/10 bg-white/90 p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h2 className="font-heading text-2xl font-bold text-foreground">{story.title}</h2>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-prompt text-primary">{story.location}</span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground font-prompt">{story.summary}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {story.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-surface-mint px-3 py-1 text-xs font-semibold text-mint-800">
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button className="rounded-2xl px-6 py-6 font-prompt text-base" asChild>
            <a href="https://forms.gle/" target="_blank" rel="noopener noreferrer">
              แชร์เรื่องราวของคุณ
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SuccessStoriesPage;
