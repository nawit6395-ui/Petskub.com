import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PhoneCall, MessageCircle, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "ช่วยเหลือด่วน | Petskub",
  description: "ช่องทางติดต่อทีมอาสาและคำแนะนำเบื้องต้นเมื่อพบสัตว์ที่ต้องการความช่วยเหลือ",
};

const emergencyContacts = [
  {
    title: "สายด่วนทีมอาสา",
    description: "โทรแจ้งเหตุพร้อมพิกัดและอาการเบื้องต้น เพื่อให้ทีมเตรียมอุปกรณ์ช่วยเหลือ",
    action: "โทร 090-XXX-XXXX",
    icon: PhoneCall,
  },
  {
    title: "LINE OpenChat",
    description: "ส่งรูปถ่ายและรายละเอียดเพิ่มเติม รวมทั้งติดตามความคืบหน้าแบบเรียลไทม์",
    action: "@petskub-rescue",
    icon: MessageCircle,
  },
  {
    title: "เคลื่อนย้ายฉุกเฉิน",
    description: "หากจำเป็นต้องพาสัตว์ออกจากพื้นที่ อาสาสมัครจะประสานจุดรับตัวให้",
    action: "กรอกฟอร์ม",
    icon: MapPin,
  },
];

const HelpPage = () => {
  return (
    <div className="min-h-screen bg-surface-cool/50 pb-16 pt-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-prompt text-xs uppercase tracking-[0.4em] text-success/70">emergency</p>
          <h1 className="mt-3 font-heading text-4xl font-bold text-foreground">ขอความช่วยเหลือด่วน</h1>
          <p className="mt-4 text-base text-muted-foreground font-prompt">
            หากพบสัตว์ได้รับบาดเจ็บหรือเสี่ยงอันตราย กรุณาใช้ช่องทางด้านล่างเพื่อให้ทีมงานช่วยเหลืออย่างปลอดภัย
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {emergencyContacts.map(({ title, description, action, icon: Icon }) => (
            <Card key={title} className="rounded-[28px] border border-success/20 bg-white p-6 shadow-soft">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
                <Icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 font-heading text-xl font-bold text-foreground">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground font-prompt">{description}</p>
              <Button variant="outline" className="mt-4 rounded-2xl font-prompt">{action}</Button>
            </Card>
          ))}
        </div>

        <Alert className="mt-10 rounded-[28px] border border-amber-200 bg-amber-50">
          <AlertTitle className="font-heading text-xl text-amber-700">ข้อควรปฏิบัติระหว่างรอทีมงาน</AlertTitle>
          <AlertDescription className="mt-3 space-y-2 text-sm text-amber-700 font-prompt">
            <p>• อย่าให้อาหารที่มีก้างหรือกระดูก</p>
            <p>• หลีกเลี่ยงการจับต้องบาดแผลโดยตรง</p>
            <p>• หากอยู่ริมถนนให้ช่วยตั้งกรวยหรือสิ่งกีดขวางชั่วคราว</p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

export default HelpPage;
