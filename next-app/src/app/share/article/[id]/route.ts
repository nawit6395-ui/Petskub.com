import { NextRequest, NextResponse } from "next/server";

import { getPublishedArticle } from "@/lib/server/articles";

const FALLBACK_SITE_URL = "https://baanpets.netlify.app";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1200&q=80";

const pickImage = (value: string | string[] | null | undefined) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value.find((item) => typeof item === "string" && item.trim().length > 0) ?? null;
  }
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const resolveSiteUrl = (request: Request) => {
  const explicitSite =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VITE_SITE_URL || "";

  if (explicitSite) {
    return explicitSite.startsWith("http") ? explicitSite.replace(/\/$/, "") : `https://${explicitSite}`;
  }

  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${protocol}://${forwardedHost}`.replace(/\/$/, "");
  }

  return FALLBACK_SITE_URL;
};

const buildHtml = (options: {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  articleUrl: string;
}) => {
  const safeTitle = escapeHtml(options.title);
  const safeDescription = escapeHtml(options.description);
  const safeImage = escapeHtml(options.image);
  const safeArticleUrl = escapeHtml(options.articleUrl);
  const safeImageAlt = escapeHtml(options.imageAlt || options.title);

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

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const slugOrId = decodeURIComponent(id);
  const article = await getPublishedArticle(slugOrId);

  if (!article) {
    return NextResponse.json({ message: "Article not found" }, { status: 404 });
  }

  const siteUrl = resolveSiteUrl(request);
  const path = `/knowledge/${article.slug ?? article.id}`;
  const articleUrl = `${siteUrl}${path}`;

  const image = pickImage(article.og_image) || pickImage(article.image_url) || FALLBACK_IMAGE;
  const description =
    article.og_description || article.meta_description || "สำรวจบทความจาก Petskub เพื่อช่วยเหลือสัตว์จรจัด";
  const title = article.og_title || article.meta_title || article.title;
  const html = buildHtml({
    title,
    description,
    image,
    imageAlt: article.image_alt || article.title || title,
    articleUrl,
  });

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
}
