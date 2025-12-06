import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "เว็บบอร์ดชุมชน | Petskub",
  description: "พูดคุย แลกเปลี่ยน และหาเพื่อนอาสาในคอมมูนิตี้",
};

const ForumPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-lilac/40 to-white pb-20 pt-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="font-prompt text-xs uppercase tracking-[0.4em] text-lilac">community forum</p>
          <h1 className="mt-3 font-heading text-4xl font-bold text-foreground">เว็บบอร์ดกำลังเปิดใช้งาน</h1>
          <p className="mt-4 text-base text-muted-foreground font-prompt">
            เรากำลังย้ายข้อมูลจากแพลตฟอร์มเดิม และจะเปิดให้อ่านโพสต์เก่า/สร้างกระทู้ใหม่เร็ว ๆ นี้
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="rounded-[28px] border border-lilac/20 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold text-lilac">ขั้นตอนต่อไป</p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-foreground">เปิดอ่านกระทู้เก่า</h2>
            <p className="mt-3 text-sm text-muted-foreground font-prompt">
              ทีมงานกำลังสำรองข้อมูลบทสนทนาที่สำคัญ เช่น เคสการรักษา เคสหาบ้าน และบทความแนะนำ
            </p>
          </Card>

          <Card className="rounded-[28px] border border-primary/20 bg-white p-6 shadow-soft">
            <p className="text-sm font-semibold text-primary">ร่วมทดสอบ</p>
            <h2 className="mt-2 font-heading text-2xl font-bold text-foreground">ลงชื่อเพื่อรับสิทธิ์ Beta</h2>
            <p className="mt-3 text-sm text-muted-foreground font-prompt">
              กรอกอีเมลของคุณเพื่อรับการแจ้งเตือนเมื่อสามารถเริ่มใช้งานเว็บบอร์ดรุ่นใหม่ได้
            </p>
            <Button className="mt-4 rounded-2xl font-prompt">ลงทะเบียนสนใจ</Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForumPage;
