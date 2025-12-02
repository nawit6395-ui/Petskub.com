import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

const supabase = createClient(supabaseUrl, supabaseKey);

const siteFromEnv = (process.env.VITE_SITE_URL || process.env.VERCEL_URL || "").replace(
  /\/$/,
  ""
);
const fallbackSite = "https://baanpets.netlify.app";
const defaultImage =
  "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=1200&q=80";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const pickImageSource = (value: unknown): string | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const found = value.find(
      (item) => typeof item === "string" && item.trim().length > 0
    );
    return found ?? null;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
};

const ensureAbsoluteUrl = (value: string | null, siteUrl: string): string => {
  if (!value) return defaultImage;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return `${siteUrl}${trimmed}`;

  const supabaseBase = supabaseUrl.replace(/\/$/, "");
  if (supabaseBase) {
    if (trimmed.startsWith("storage/v1/object/public")) {
      return `${supabaseBase}/${trimmed}`;
    }
    return `${supabaseBase}/storage/v1/object/public/${trimmed}`;
  }

  return `${siteUrl}/${trimmed}`;
};

const summarize = (value?: string | null) => {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= 180) return normalized;
  return `${normalized.slice(0, 177)}...`;
};

const deriveSiteUrl = (req: VercelRequest) => {
  if (siteFromEnv) {
    return siteFromEnv.startsWith("http") ? siteFromEnv : `https://${siteFromEnv}`;
  }
  const headerHost = (req.headers["x-forwarded-host"] || req.headers.host || "").toString();
  const headerProto = (req.headers["x-forwarded-proto"] || "https").toString();
  if (headerHost) {
    return `${headerProto}://${headerHost}`.replace(/\/$/, "");
  }
  return fallbackSite;
};

interface CatRecord {
  id: string;
  name: string | null;
  age: string | null;
  gender: string | null;
  province: string | null;
  district: string | null;
  story: string | null;
  health_status: string | null;
  is_adopted: boolean | null;
  image_url: string[] | string | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let id = String(req.query.id ?? "").trim();

  if (!id && req.url) {
    const pathMatch = req.url.match(/^\/share\/pet\/(.+)$/);
    if (pathMatch && pathMatch[1]) {
      id = decodeURIComponent(pathMatch[1]);
    }
  }

  if (!id) {
    res.status(400).send("Missing pet id");
    return;
  }

  const siteUrl = deriveSiteUrl(req);
  const pageUrl = `${siteUrl}/adopt?pet=${encodeURIComponent(id)}`;

  let record: CatRecord | null = null;
  try {
    const { data, error } = await supabase
      .from("cats")
      .select(
        "id, name, age, gender, province, district, story, health_status, is_adopted, image_url"
      )
      .eq("id", id)
      .single<CatRecord>();
    if (error) {
      console.error("pet-share: supabase error", error.message);
    } else {
      record = data;
    }
  } catch (error) {
    console.error("pet-share: fetch failed", error);
  }

  if (!record) {
    const html = buildHtml({
      title: "Petskub - โปรไฟล์สัตว์รอบ้าน",
      description:
        "ช่วยแชร์ให้น้อง ๆ จาก Petskub ได้พบครอบครัวใหม่ที่อบอุ่น",
      image: defaultImage,
      imageAlt: "Petskub - โปรไฟล์สัตว์รอบ้าน",
      pageUrl,
    });
    res
      .status(200)
      .setHeader("Content-Type", "text/html; charset=utf-8")
      .send(html);
    return;
  }

  const name = record.name || "น้องแมว";
  const locationParts = [record.province, record.district]
    .filter(Boolean)
    .join(" · ");
  const statusLabel = record.is_adopted ? "ได้รับการรับเลี้ยงแล้ว" : "กำลังหาบ้าน";
  const story = summarize(record.story);
  const descriptionFallback = [
    `สถานะ: ${statusLabel}`,
    record.age ? `อายุ: ${record.age}` : null,
    locationParts ? `พื้นที่: ${locationParts}` : null,
    record.health_status ? `สุขภาพ: ${record.health_status}` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  const description = story || descriptionFallback || "ช่วยน้องสัตว์ที่กำลังหาบ้าน";

  const imageSrc = ensureAbsoluteUrl(pickImageSource(record.image_url), siteUrl);

  const html = buildHtml({
    title: `ช่วยให้น้อง${name}ได้บ้าน | Petskub`,
    description,
    image: imageSrc,
    imageAlt: `โปรไฟล์ของน้อง${name}`,
    pageUrl: `${siteUrl}/adopt?pet=${encodeURIComponent(record.id)}`,
  });

  res
    .status(200)
    .setHeader("Content-Type", "text/html; charset=utf-8")
    .send(html);
}

interface TemplateOptions {
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
  pageUrl: string;
}

const buildHtml = ({ title, description, image, imageAlt, pageUrl }: TemplateOptions) => {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeImageAlt = escapeHtml(imageAlt || title);
  const safeUrl = escapeHtml(pageUrl);

  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <link rel="canonical" href="${safeUrl}" />
    <meta name="description" content="${safeDescription}" />

    <meta property="og:type" content="article" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:image:alt" content="${safeImageAlt}" />
    <meta property="og:url" content="${safeUrl}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImage}" />

    <meta http-equiv="refresh" content="0; url=${safeUrl}" />
    <script>window.location.replace("${safeUrl}");</script>
    <style>
      body {
        font-family: 'Prompt', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #fff5ec;
        color: #2b1f18;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        text-align: center;
      }
      a {
        color: #f97316;
      }
    </style>
  </head>
  <body>
    <div>
      <h1>${safeTitle}</h1>
      <p>กำลังพาไปยังโปรไฟล์สัตว์เลี้ยง...</p>
      <p><a href="${safeUrl}">คลิกที่นี่หากไม่ได้ถูกนำทางอัตโนมัติ</a></p>
    </div>
  </body>
</html>`;
};
