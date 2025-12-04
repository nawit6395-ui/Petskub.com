import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export const metadata: Metadata = {
  title: "ไม่พบหน้าที่ต้องการ | PetsKub",
  description: "ขออภัย ไม่พบหน้าที่คุณต้องการ",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f4a259",
};

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-surface-cool px-6 text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="font-heading text-3xl font-bold text-foreground">ขออภัย ไม่พบหน้าที่ต้องการ</h1>
      <p className="mt-3 max-w-xl text-base text-muted-foreground">
        ลิงก์อาจถูกลบออกหรือเปลี่ยนที่อยู่ กรุณากลับไปยังหน้าแรกหรือเลือกเมนูอื่นด้านบน
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-white shadow-hover"
      >
        <Home className="h-5 w-5" /> กลับหน้าแรก
      </Link>
    </div>
  );
}
