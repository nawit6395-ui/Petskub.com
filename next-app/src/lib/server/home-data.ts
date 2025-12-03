import "server-only";

export type CatSummary = {
  id: string;
  name: string;
  age: string;
  province: string;
  story: string;
  image: string;
  urgent: boolean;
};

export type ReportSummary = {
  id: string;
  province: string;
  status: "open" | "resolved";
};

export type HomeStats = {
  adopted: number;
  available: number;
  reports: number;
  urgentCases: number;
};

export type HomeData = {
  stats: HomeStats;
  urgentCats: CatSummary[];
  reports: ReportSummary[];
};

const fallbackData: HomeData = {
  stats: {
    adopted: 128,
    available: 54,
    reports: 37,
    urgentCases: 3,
  },
  urgentCats: [
    {
      id: "cat-01",
      name: "เจ้ามะลิ",
      age: "2 ปี",
      province: "กรุงเทพฯ",
      story: "แมวน้อยขี้อ้อนที่ถูกพบตามลำพัง ต้องการบ้านที่อบอุ่นและใจดี",
      image: "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=480&q=80",
      urgent: true,
    },
    {
      id: "cat-02",
      name: "เจ้าพอม",
      age: "1 ปี",
      province: "เชียงใหม่",
      story: "พอมถูกช่วยจากถนนใหญ่ ตอนนี้พร้อมเจอผู้ดูแลที่จะให้ความรัก",
      image: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=480&q=80",
      urgent: true,
    },
    {
      id: "cat-03",
      name: "เจ้าก้อนเมฆ",
      age: "3 ปี",
      province: "ขอนแก่น",
      story: "แมวว่านอนสอนง่าย ชอบให้ลูบหลังและเล่นของเล่น",
      image: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=480&q=80",
      urgent: false,
    },
  ],
  reports: [
    { id: "report-01", province: "กรุงเทพฯ", status: "open" },
    { id: "report-02", province: "นครราชสีมา", status: "resolved" },
    { id: "report-03", province: "ภูเก็ต", status: "open" },
  ],
};

export async function getHomeData(): Promise<HomeData> {
  // TODO: Replace with Supabase/REST fetch once credentials are wired up.
  return fallbackData;
}
