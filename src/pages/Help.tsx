import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Phone, Plus } from "lucide-react";
import { useUrgentCases } from "@/hooks/useUrgentCases";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { UrgentCaseCard } from "@/components/UrgentCaseCard";
import rescuePrimaryPicture from "@/assets/knowledge-sick-cat.jpg?w=640;960;1280&format=avif;webp;jpg&as=picture";
import rescueSecondaryPicture from "@/assets/knowledge-parasite-check.jpg?w=360;540;720&format=avif;webp;jpg&as=picture";
import rescueSupportPicture from "@/assets/knowledge-dangerous-foods.jpg?w=320;480;640&format=avif;webp;jpg&as=picture";
import rescueCarePicture from "@/assets/knowledge-cat-adjusting.jpg?w=320;480;640&format=avif;webp;jpg&as=picture";
import rescueFocusPicture from "@/assets/knowledge-trimming-nails.jpg?w=360;540;720&format=avif;webp;jpg&as=picture";
import { ResponsivePicture } from "@/components/ResponsivePicture";

const Help = () => {
  const { data: urgentCases, isLoading } = useUrgentCases({ includeResolved: true });
  const { user } = useAuth();
  const activeCases = urgentCases?.filter((urgentCase) => !urgentCase.is_resolved) ?? [];
  const resolvedCases = urgentCases?.filter((urgentCase) => urgentCase.is_resolved) ?? [];

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <section className="mb-12 rounded-[46px] border border-white/70 bg-gradient-to-br from-[#fff0f2] via-white to-[#f0fcf7] px-5 py-8 sm:px-10 sm:py-12 shadow-[0_25px_80px_rgba(15,23,42,0.08)]">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
                  <span>Emergency</span>
                  <span className="rounded-full bg-white/90 px-4 py-1 tracking-normal text-rose-600 shadow-sm">24/7 SOS</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-4xl font-bold font-prompt text-rose-600">ช่วยเหลือสัตว์จรจัดด่วน</h1>
                  <span className="rounded-2xl bg-gradient-to-r from-rose-500 via-rose-400 to-orange-400 px-3 py-1 text-sm font-semibold text-white shadow-soft">SOS</span>
                </div>
                <p className="text-muted-foreground font-prompt text-base sm:text-lg">
                  รายงานพบหมาหรือแมวบาดเจ็บ สัตว์จรจัดตกทุกข์ได้ยาก ระบุตำแหน่งและข้อมูลติดต่อให้ทีมอาสาสมัครช่วยเหลือเดินทางถึงพื้นที่ได้เร็วขึ้น
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-3xl border border-rose-100 bg-white/90 p-4 text-sm shadow-[0_18px_45px_rgba(244,114,182,0.15)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-lg">📷</div>
                  <div>
                    <p className="font-semibold text-slate-900">เพิ่มรูปหลักฐาน</p>
                    <p className="text-xs text-muted-foreground">ช่วยทีมประเมินความเสี่ยงและเตรียมอุปกรณ์ตรงจุด</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-3xl border border-emerald-100 bg-white/90 p-4 text-sm shadow-[0_18px_45px_rgba(16,185,129,0.18)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-lg">🎯</div>
                  <div>
                    <p className="font-semibold text-slate-900">ระบบจับพิกัดอัตโนมัติ</p>
                    <p className="text-xs text-muted-foreground">แนะนำจุดช่วยเหลือใกล้เคียงในรัศมี 5 กม.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {user ? (
                  <Link to="/add-urgent-case" className="inline-flex">
                    <Button className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 px-6 py-5 text-base font-prompt text-white shadow-soft">
                      <Plus className="w-4 h-4" />
                      แจ้งกรณีฉุกเฉินทันที
                    </Button>
                  </Link>
                ) : (
                  <Link to="/login" className="inline-flex">
                    <Button className="rounded-2xl bg-gradient-to-r from-rose-500 to-orange-400 px-6 py-5 text-base font-prompt text-white shadow-soft">
                      <Plus className="w-4 h-4" />
                      เข้าสู่ระบบเพื่อแจ้งเหตุ
                    </Button>
                  </Link>
                )}
                <Button variant="outline" className="rounded-2xl border-emerald-300 bg-white px-5 py-5 font-prompt text-emerald-700 shadow-sm">
                  <Phone className="w-4 h-4" />
                  โทร 1669 ด่วน
                </Button>
              </div>
              <div className="flex flex-wrap gap-6 text-sm font-prompt text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  เคสที่รอการช่วยเหลือ {activeCases.length} ราย
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  ปิดเคสแล้ว {resolvedCases.length} ราย
                </div>
              </div>
            </div>

            <div className="relative min-h-[320px] lg:min-h-[360px]">
              <div className="absolute inset-0 -z-10 rounded-[48px] bg-gradient-to-br from-rose-200/40 via-transparent to-emerald-200/40 blur-3xl" />
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div className="media-frame h-[260px] sm:h-[320px] w-full">
                  <ResponsivePicture
                    picture={rescuePrimaryPicture}
                    alt="อาสาช่วยเหลือสัตว์บาดเจ็บ"
                    sizes="(max-width: 1024px) 100vw, 640px"
                    loading="eager"
                    decoding="async"
                    className="block h-full w-full"
                    imgClassName="h-full w-full object-cover"
                  />
                  <div className="absolute left-4 top-4 rounded-2xl bg-black/55 px-3 py-2 text-[11px] font-prompt text-white shadow-lg">
                    ปฏิบัติการอยู่ {activeCases.length ? `${activeCases.length} เคส` : "พร้อมรับแจ้ง"}
                  </div>
                  <div className="absolute inset-x-5 bottom-5 flex items-center justify-between rounded-2xl bg-white/95 px-4 py-3 text-[11px] font-prompt text-slate-800 shadow-[0_18px_45px_rgba(15,23,42,0.15)] sm:text-sm">
                    <span className="flex flex-col leading-tight">
                      <span className="text-xs text-muted-foreground">รอการช่วยเหลือ</span>
                      <strong className="text-lg text-rose-600">{activeCases.length}</strong>
                    </span>
                    <span className="flex flex-col text-right leading-tight">
                      <span className="text-xs text-muted-foreground">ปิดเคสแล้ว</span>
                      <strong className="text-lg text-emerald-600">{resolvedCases.length}</strong>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="media-frame-sm h-[150px]">
                    <ResponsivePicture
                      picture={rescueSecondaryPicture}
                      alt="การปฐมพยาบาลเบื้องต้นให้สัตว์"
                      sizes="(max-width: 640px) 90vw, 360px"
                      loading="lazy"
                      decoding="async"
                      className="block h-full w-full"
                      imgClassName="h-full w-full object-cover"
                    />
                  </div>
                  <div className="rounded-3xl border border-emerald-100 bg-white/95 p-4 text-center font-prompt shadow-lg">
                    <p className="text-xs text-muted-foreground">ระบบจับพิกัดอัตโนมัติ</p>
                    <p className="text-xl font-semibold text-emerald-600">ภายใน 5 กม.</p>
                    <p className="text-xs text-muted-foreground">แจ้งทีมอาสาใกล้ที่สุดทันที</p>
                  </div>
                  <div className="media-frame-sm h-[120px]">
                    <ResponsivePicture
                      picture={rescueFocusPicture}
                      alt="การดูแลสัตว์บาดเจ็บ"
                      sizes="(max-width: 640px) 90vw, 320px"
                      loading="lazy"
                      decoding="async"
                      className="block h-full w-full"
                      imgClassName="h-full w-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:hidden">
                <div className="media-frame-sm h-[120px]">
                  <ResponsivePicture
                    picture={rescueSupportPicture}
                    alt="อุปกรณ์ช่วยสัตว์"
                    sizes="(max-width: 640px) 50vw, 220px"
                    loading="lazy"
                    decoding="async"
                    className="block h-full w-full"
                    imgClassName="h-full w-full object-cover"
                  />
                </div>
                <div className="media-frame-sm h-[120px]">
                  <ResponsivePicture
                    picture={rescueCarePicture}
                    alt="ทีมช่วยเหลือเตรียมอุปกรณ์"
                    sizes="(max-width: 640px) 50vw, 220px"
                    loading="lazy"
                    decoding="async"
                    className="block h-full w-full"
                    imgClassName="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Emergency Contact Card */}
        <Card className="mb-8 p-6 bg-urgent/5 border-urgent shadow-card">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-urgent flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-2 font-prompt">ติดต่อฉุกเฉิน</h2>
              <p className="text-muted-foreground mb-4 font-prompt">
                หากพบแมวหรือสุนัขบาดเจ็บหรือป่วยหนัก กรุณาติดต่อศูนย์ช่วยเหลือสัตว์ฉุกเฉิน
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="font-prompt gap-2">
                  <Phone className="w-4 h-4" />
                  โทร 1669 (ฉุกเฉิน)
                </Button>
                <Button variant="outline" className="font-prompt gap-2">
                  <Phone className="w-4 h-4" />
                  สายด่วนสัตว์ป่วย
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Urgent Cases Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-prompt">กำลังโหลด...</p>
          </div>
        ) : urgentCases && urgentCases.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {urgentCases.map((urgentCase) => (
              <UrgentCaseCard key={urgentCase.id} {...urgentCase} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-prompt">ไม่มีกรณีฉุกเฉินในขณะนี้</p>
          </div>
        )}

        {/* Help Guidelines */}
        <Card className="mt-12 p-4 sm:p-6 bg-secondary/50">
          <h2 className="text-lg sm:text-xl font-bold mb-4 font-prompt">🤝 แนวทางการช่วยเหลือ</h2>
          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="font-semibold mb-2 font-prompt">สิ่งที่ควรทำ</h3>
              <ul className="space-y-2 text-sm text-muted-foreground font-prompt">
                <li>✓ ตรวจสอบอาการเบื้องต้น</li>
                <li>✓ ถ่ายรูปบันทึกหลักฐาน</li>
                <li>✓ ติดต่อสัตวแพทย์ใกล้เคียง</li>
                <li>✓ แจ้งตำแหน่งที่ชัดเจน</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 font-prompt">สิ่งที่ไม่ควรทำ</h3>
              <ul className="space-y-2 text-sm text-muted-foreground font-prompt">
                <li>✗ ย้ายสัตว์บาดเจ็บเอง</li>
                <li>✗ ให้ยาโดยไม่ปรึกษาสัตวแพทย์</li>
                <li>✗ เพิกเฉยกรณีบาดเจ็บหนัก</li>
                <li>✗ ให้อาหารไม่เหมาะสม</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Help;
