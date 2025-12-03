import { Suspense } from "react";
import { getHomeData } from "@/lib/server/home-data";
import { HomeClient } from "@/components/home/HomeClient";

export default async function HomePage() {
  const data = await getHomeData();

  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-muted-foreground">กำลังโหลด...</div>}>
      <HomeClient data={data} />
    </Suspense>
  );
}
