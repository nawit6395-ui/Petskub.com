"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Sparkles, Heart, MapPin, AlertTriangle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type HomeData, type CatSummary } from "@/lib/server/home-data";
import { cn } from "@/lib/utils";

function CatCardTile({ cat }: { cat: CatSummary }) {
  return (
    <Card className="overflow-hidden rounded-3xl border border-white/60 bg-white/90 shadow-soft transition hover:-translate-y-1 hover:shadow-hover">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={cat.image}
          alt={cat.name}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, (max-width:1200px) 50vw, 25vw"
          priority={cat.urgent}
        />
      </div>
      <div className="space-y-2 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-heading text-lg font-semibold text-foreground">{cat.name}</h3>
          {cat.urgent && (
            <span className="rounded-full bg-gradient-to-r from-rose-500 to-amber-500 px-3 py-1 text-xs font-bold text-white shadow-soft">
              ด่วน
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          อายุ {cat.age} • จังหวัด {cat.province}
        </p>
        <p className="text-sm text-foreground/80 line-clamp-3">{cat.story}</p>
        <Button asChild className="mt-3 w-full rounded-full bg-primary text-primary-foreground">
          <Link href={`/adopt/${cat.id}`}>ดูรายละเอียด</Link>
        </Button>
      </div>
    </Card>
  );
}

export function HomeClient({ data }: { data: HomeData }) {
  const [showUrgentOnly, setShowUrgentOnly] = useState(true);

  const urgentCats = useMemo(() => {
    if (showUrgentOnly) {
      return data.urgentCats.filter((cat) => cat.urgent);
    }
    return data.urgentCats;
  }, [data.urgentCats, showUrgentOnly]);

  return (
    <div className="space-y-20 pb-20">
      <section className="relative overflow-hidden bg-surface-warm">
        <div className="absolute inset-0 bg-gradient-sunrise opacity-20" aria-hidden />
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary shadow-sm">
                <Sparkles className="h-4 w-4" />
                ชุมชนคนรักสัตว์
              </div>
              <h1 className="font-heading text-4xl font-extrabold tracking-wide text-foreground sm:text-5xl">
                ช่วยแมวและสุนัขจร ให้ได้บ้านที่อบอุ่น
              </h1>
              <p className="font-prompt text-base leading-relaxed text-muted-foreground">
                ร่วมเป็นส่วนหนึ่งของชุมชนที่ใส่ใจแมวและสุนัขจร ช่วยกันหาบ้านที่อบอุ่น ลดปัญหาสัตว์จรจัดในเมือง
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-14 flex-1 rounded-full bg-primary text-primary-foreground">
                  <Link href="/adopt">
                    <Heart className="mr-2 h-5 w-5" /> หาสัตว์เลี้ยงรับเลี้ยง
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 flex-1 rounded-full border-mint/60 bg-white/70 text-foreground">
                  <Link href="/add-cat">ลงประกาศหาบ้านให้สัตว์เลี้ยง</Link>
                </Button>
              </div>
            </div>
            <div className="media-frame relative">
              <Image
                src="https://images.unsplash.com/photo-1494256997604-768d1f608cac?auto=format&fit=crop&w=1200&q=80"
                alt="คนอุ้มน้องหมากับน้องแมว"
                width={1200}
                height={900}
                className="h-full w-full object-cover"
                priority
              />
              <div className="absolute -bottom-8 right-8 hidden rounded-3xl border border-white/60 bg-white/80 px-6 py-4 shadow-soft md:block">
                <p className="font-prompt text-sm text-muted-foreground">สัตว์ได้บ้านแล้ว</p>
                <p className="font-heading text-2xl font-bold text-success">{data.stats.adopted}+</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-cool py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "สัตว์ได้บ้านแล้ว",
                value: data.stats.adopted,
                icon: Heart,
                color: "text-blush",
              },
              {
                label: "สัตว์รอรับเลี้ยง",
                value: data.stats.available,
                icon: Filter,
                color: "text-sunrise",
              },
              {
                label: "จุดสัตว์จร",
                value: data.stats.reports,
                icon: MapPin,
                color: "text-mint",
              },
              {
                label: "กรณีด่วน",
                value: data.stats.urgentCases,
                icon: AlertTriangle,
                color: "text-lilac",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card
                key={label}
                className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-6 text-center shadow-soft"
              >
                <div className={cn("mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full text-xl", color, "bg-primary/10")}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-heading text-3xl font-bold text-foreground">{value}</p>
                <p className="font-prompt text-sm text-muted-foreground">{label}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface-sand py-16">
        <div className="container mx-auto space-y-8 px-4">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-heading text-3xl font-bold">สัตว์หาบ้านด่วน 🆘</h2>
              <p className="font-prompt text-muted-foreground">
                น้องแมวและสุนัขเหล่านี้กำลังรอคุณอยู่ เลือกดูเพิ่มเติมหรือคัดกรองตามความต้องการได้เลย
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={showUrgentOnly ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setShowUrgentOnly(true)}
              >
                เฉพาะเคสด่วน
              </Button>
              <Button
                variant={!showUrgentOnly ? "default" : "outline"}
                className="rounded-full"
                onClick={() => setShowUrgentOnly(false)}
              >
                ดูทั้งหมด
              </Button>
            </div>
          </div>

          {urgentCats.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {urgentCats.map((cat) => (
                <CatCardTile key={cat.id} cat={cat} />
              ))}
            </div>
          ) : (
            <Card className="rounded-3xl border border-dashed border-primary/40 bg-white/70 p-10 text-center shadow-soft">
              <p className="font-prompt text-lg text-muted-foreground">
                ยังไม่มีกรณีด่วนในขณะนี้ ลองกลับมาใหม่อีกครั้งหรือดูสัตว์ที่รอรับเลี้ยงทั้งหมด
              </p>
              <Button asChild className="mt-4 rounded-full">
                <Link href="/adopt">ดูสัตว์ทั้งหมด</Link>
              </Button>
            </Card>
          )}
        </div>
      </section>

      <section className="bg-gradient-warm py-16 text-white">
        <div className="container mx-auto space-y-6 px-4 text-center">
          <h2 className="font-heading text-3xl font-bold">พร้อมที่จะเริ่มต้นแล้วหรือยัง?</h2>
          <p className="mx-auto max-w-2xl font-prompt text-lg opacity-90">
            ร่วมเป็นส่วนหนึ่งในการช่วยเหลือแมวและสุนัขจร สร้างความเปลี่ยนแปลงที่ดีต่อชีวิตของพวกเขา
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary" className="rounded-full bg-white text-primary">
              <Link href="/adopt">เริ่มหาสัตว์เลี้ยงรับเลี้ยง</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full border-white/80 bg-transparent text-white hover:bg-white/20"
            >
              <Link href="/add-cat">ลงประกาศหาบ้าน</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

