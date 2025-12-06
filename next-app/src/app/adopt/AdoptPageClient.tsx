"use client";

import { useMemo, useState } from "react";
import { Loader2, PawPrint, Search, SlidersHorizontal } from "lucide-react";
import { useCats } from "@/shared/hooks/useCats";
import CatCard from "@/components/CatCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

const AdoptPageClient = () => {
  const { data: cats, isLoading, isError, error } = useCats();
  const [search, setSearch] = useState("");
  const [onlyUrgent, setOnlyUrgent] = useState(false);
  const [showAdopted, setShowAdopted] = useState(false);

  const filteredCats = useMemo(() => {
    if (!cats) return [];
    return cats.filter((cat) => {
      if (onlyUrgent && !cat.is_urgent) return false;
      if (!showAdopted && cat.is_adopted) return false;
      const haystack = `${cat.name} ${cat.province ?? ""} ${cat.district ?? ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });
  }, [cats, onlyUrgent, search, showAdopted]);

  return (
    <div className="rounded-[32px] bg-white/90 p-6 shadow-card backdrop-blur-sm">
      <div className="rounded-[28px] border border-primary/10 bg-gradient-to-r from-primary/5 via-white to-primary/5 p-5 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label htmlFor="pet-search" className="text-sm font-semibold text-muted-foreground font-prompt">
              ค้นหาชื่อหรือจังหวัด
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-soft">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                id="pet-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="เช่น เชียงใหม่ หรือ น้องเหมียว"
                className="border-0 bg-transparent px-0 font-prompt focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant={onlyUrgent ? "default" : "outline"}
              className="justify-start gap-2 rounded-2xl font-prompt"
              onClick={() => setOnlyUrgent((prev) => !prev)}
            >
              <SlidersHorizontal className="h-4 w-4" />
              เคสด่วน
            </Button>
            <Button
              type="button"
              variant={showAdopted ? "default" : "outline"}
              className="justify-start gap-2 rounded-2xl font-prompt"
              onClick={() => setShowAdopted((prev) => !prev)}
            >
              <PawPrint className="h-4 w-4" />
              แสดงที่ได้บ้านแล้ว
            </Button>
          </div>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive" className="mt-6">
          <AlertDescription className="font-prompt">
            {(error as Error)?.message || "ไม่สามารถโหลดข้อมูลสัตว์เลี้ยงได้"}
          </AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-prompt">กำลังดึงข้อมูลประกาศล่าสุด...</p>
        </div>
      )}

      {!isLoading && filteredCats.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-primary/20 bg-primary/5 p-10 text-center">
          <p className="text-xl font-semibold text-primary font-prompt">ยังไม่พบประกาศที่ตรงกับเงื่อนไข</p>
          <p className="mt-2 text-sm text-muted-foreground font-prompt">
            ลองปรับการค้นหาหรือเลือกตัวกรองใหม่อีกครั้งนะคะ
          </p>
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCats.map((cat) => (
          <CatCard
            key={cat.id}
            id={cat.id}
            name={cat.name}
            age={cat.age}
            province={cat.province}
            district={cat.district}
            images={cat.image_url ?? []}
            story={cat.story}
            gender={cat.gender}
            isAdopted={cat.is_adopted}
            urgent={cat.is_urgent}
            contactName={cat.contact_name}
            contactPhone={cat.contact_phone}
            contactLine={cat.contact_line}
            userId={cat.user_id}
            healthStatus={cat.health_status}
            isSterilized={cat.is_sterilized}
          />
        ))}
      </div>

      {!isLoading && filteredCats.length > 0 && (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 rounded-3xl bg-muted/40 px-6 py-4">
          <Badge variant="secondary" className="rounded-full px-4 py-2 font-prompt">
            พบ {filteredCats.length} ตัว
          </Badge>
          <p className="text-sm text-muted-foreground font-prompt">
            ขอบคุณที่ช่วยให้น้อง ๆ ได้บ้านใหม่ 💛
          </p>
        </div>
      )}
    </div>
  );
};

export default AdoptPageClient;
