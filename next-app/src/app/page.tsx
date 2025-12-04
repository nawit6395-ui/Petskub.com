import Link from "next/link";
import Image from "next/image";
import { MapPin, Heart, TrendingUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const heroStats = [
  { label: "สัตว์ได้บ้านแล้ว", value: "120+", icon: Heart, accent: "from-blush/60 via-white/90 to-surface-sand" },
  { label: "จุดพบสัตว์จร", value: "340 จุด", icon: MapPin, accent: "from-mint/40 via-surface-mint to-white" },
  { label: "กรณีเร่งด่วน", value: "18 เคส", icon: TrendingUp, accent: "from-lilac/50 via-white/90 to-surface-lilac" },
];

export default function Home() {
  return (
    <div className="bg-surface-warm">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-sunrise opacity-10" aria-hidden />
        <div className="container relative z-10 mx-auto grid gap-12 px-4 py-16 md:grid-cols-2 md:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-primary">
                <Heart className="h-4 w-4" />
                <span className="font-prompt text-sm">ชุมชนคนรักสัตว์</span>
              </div>
              <h1 className="font-heading text-4xl font-extrabold leading-tight tracking-wide text-foreground sm:text-5xl">
                ช่วยแมวและสุนัขจร ให้ได้บ้านที่อบอุ่น
              </h1>
              <p className="font-prompt text-base leading-relaxed text-muted-foreground">
                Petskub เป็นพื้นที่รวมอาสาสมัครที่ช่วยกันประกาศหาบ้าน แจ้งจุดพบสัตว์จร และแบ่งปันความรู้ด้านการดูแลสัตว์เลี้ยงในประเทศไทย
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-14 gap-2 rounded-full px-8 font-prompt text-base">
                  <Link href="/adopt">
                    <Heart className="h-5 w-5" /> หาสัตว์เลี้ยงรับเลี้ยง
                  </Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 gap-2 rounded-full border-mint/50 bg-white/70 px-8 font-prompt text-base"
                >
                  <Link href="/report">
                    <MapPin className="h-5 w-5" /> แจ้งจุดพบสัตว์จร
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-warm opacity-30 blur-2xl" aria-hidden />
              <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-white/50 bg-white shadow-hover">
                <Image
                  src="/hero-cat.jpg"
                  alt="ชุมชนช่วยเหลือสัตว์ Petskub"
                  width={840}
                  height={640}
                  className="h-full w-full object-cover"
                  priority
                />
                <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                  {[0, 1, 2].map((dot) => (
                    <span key={dot} className={`h-2 w-8 rounded-full ${dot === 0 ? "bg-white" : "bg-white/40"}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
      </section>

      <section className="bg-surface-cool py-12">
        <div className="container mx-auto grid gap-6 px-4 md:grid-cols-3">
            {heroStats.map(({ label, value, icon: Icon, accent }) => (
              <Card key={label} className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 p-6">
                <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-70`} aria-hidden />
                <div className="relative flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 shadow-inner">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{value}</p>
                    <p className="text-sm font-prompt text-muted-foreground">{label}</p>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      </section>
    </div>
  );
}
