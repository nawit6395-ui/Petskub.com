import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  "";

const supabase = createClient(supabaseUrl, supabaseKey);

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const siteFromEnv = (process.env.VITE_SITE_URL || process.env.VERCEL_URL || "").replace(/\/$/, "");
const fallbackSite = "https://baanpets.netlify.app";

type ArticleRecord = {
  id: string;
  slug: string | null;
  title: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  image_url: string[] | string | null;
  image_alt: string | null;
};

const pickImage = (value: unknown): string | null => {
  if (!value) return null;
  if (Array.isArray(value)) {
    const found = value.find((src) => typeof src === "string" && src.trim().length > 0);
    return found ? String(found) : null;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  return null;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let id = String(req.query.id ?? "");

  if (!id && req.url) {
    const pathMatch = req.url.match(/^\/share\/article\/(.+)$/);
    if (pathMatch && pathMatch[1]) {
      id = decodeURIComponent(pathMatch[1]);
    }
  }

  if (!id) {
    res.status(400).send("Missing article id");
    return;
  }

  const selectColumns =
    "id, slug, title, meta_title, meta_description, og_title, og_description, og_image, image_url, image_alt";

  const fetchArticle = async (field: "id" | "slug", value: string) => {
    const { data } = await supabase
      .from("knowledge_articles")
      .select(selectColumns)
      .eq(field, value)
      .eq("published", true)
      .single<ArticleRecord>();
    return data;
  };

  let article: ArticleRecord | null = null;
  try {
    article = await fetchArticle("id", id);
  } catch (err) {
    // ignore and try slug
  }

  if (!article) {
    try {
      article = await fetchArticle("slug", id);
    } catch (err) {
      // ignore, article remains null
    }
  }

  const headerHost = (req.headers["x-forwarded-host"] || req.headers.host || "").toString();
  const headerProto = (req.headers["x-forwarded-proto"] || "https").toString();
  let derivedSite = "";
  if (siteFromEnv) {
    derivedSite = siteFromEnv.startsWith("http") ? siteFromEnv : `https://${siteFromEnv}`;
  } else if (headerHost) {
    derivedSite = `${headerProto}://${headerHost}`;
  } else {
    derivedSite = fallbackSite;
  }
  const siteUrl = derivedSite.replace(/\/$/, "");

  const articlePath = article?.slug ? `/knowledge/${encodeURIComponent(article.slug)}` : `/knowledge/${encodeURIComponent(id)}`;
  const articleUrl = `${siteUrl}${articlePath}`;

  const resolvedImage =
    pickImage(article?.og_image) || pickImage(article?.image_url) ||
    "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1200&q=80";

  const html = buildHtml({
    title: article?.og_title || article?.meta_title || article?.title || "Petskub - บทความ",
    description:
      article?.og_description ||
      article?.meta_description ||
      "สำรวจบทความแมวจากชุมชน Petskub ช่วยกันดูแลน้องแมวให้มีชีวิตที่ดีขึ้น",
    image: resolvedImage,
    imageAlt: article?.image_alt || article?.title || undefined,
    articleUrl,
  });

  res.status(200).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
}

interface TemplateOpts {
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
  articleUrl: string;
}

const buildHtml = ({ title, description, image, imageAlt, articleUrl }: TemplateOpts) => {
  const safeTitle = escapeHtml(title);
  const safeDescription = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeArticleUrl = escapeHtml(articleUrl);
  const safeImageAlt = escapeHtml(imageAlt || title);

  return `<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>${safeTitle}</title>
    <link rel="canonical" href="${safeArticleUrl}" />
    <meta name="description" content="${safeDescription}" />

    <meta property="og:type" content="article" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDescription}" />
    <meta property="og:image" content="${safeImage}" />
    <meta property="og:image:alt" content="${safeImageAlt}" />
    <meta property="og:url" content="${safeArticleUrl}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDescription}" />
    <meta name="twitter:image" content="${safeImage}" />

    <meta http-equiv="refresh" content="0; url=${safeArticleUrl}" />
    <script>
      window.location.replace("${safeArticleUrl}");
    </script>
    <style>
      body {
        font-family: 'Prompt', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background: #f7f5ff;
        color: #2d2a44;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 24px;
        text-align: center;
      }
      a {
        color: #6c5ce7;
      }
    </style>
  </head>
  <body>
    <div>
      <h1>${safeTitle}</h1>
      <p>กำลังพาคุณไปยังบทความ...</p>
      <p><a href="${safeArticleUrl}">คลิกที่นี่หากไม่ได้ถูกนำทางอัตโนมัติ</a></p>
    </div>
  </body>
</html>`;
};
