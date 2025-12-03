import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { ArticleDetailClient } from "@/components/knowledge/ArticleDetailClient";
import {
  getPublishedArticle,
  getRelatedArticles,
  incrementArticleViewCount,
} from "@/lib/server/articles";

const FALLBACK_SITE_URL = "https://baanpets.netlify.app";
const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1200&q=80";

const pickImage = (value: string | string[] | null | undefined) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value.find((item) => typeof item === "string" && item.trim().length > 0) ?? null;
  }
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const resolveSiteUrl = async (): Promise<string> => {
  const explicitSite =
    process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || process.env.VITE_SITE_URL || "";

  if (explicitSite) {
    return explicitSite.startsWith("http") ? explicitSite.replace(/\/$/, "") : `https://${explicitSite}`;
  }

  const headerList = await headers();
  const forwardedHost = headerList.get("x-forwarded-host") || headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") || "https";

  if (forwardedHost) {
    return `${protocol}://${forwardedHost}`.replace(/\/$/, "");
  }

  return FALLBACK_SITE_URL;
};

type PageParams = {
  params: {
    slug: string;
  };
};

export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const article = await getPublishedArticle(params.slug);

  if (!article) {
    return {
      title: "ไม่พบบทความ | Petskub",
      description: "ไม่พบบทความตามที่ค้นหา",
    };
  }

  const siteUrl = await resolveSiteUrl();
  const path = `/knowledge/${article.slug ?? article.id}`;
  const canonicalUrl = `${siteUrl}${path}`;
  const ogImage = pickImage(article.og_image) || pickImage(article.image_url) || FALLBACK_IMAGE;
  const description =
    article.og_description || article.meta_description || "สำรวจบทความจาก Petskub เพื่อช่วยเหลือสัตว์จรจัด";
  const title = article.og_title || article.meta_title || article.title;

  return {
    title,
    description,
    keywords: article.keywords ?? undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title,
      description,
      images: [{ url: ogImage, alt: article.image_alt || article.title || undefined }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function KnowledgeArticlePage({ params }: PageParams) {
  const article = await getPublishedArticle(params.slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(article.category, article.id);
  await incrementArticleViewCount(article.id);

  const siteUrl = await resolveSiteUrl();
  const canonicalUrl = `${siteUrl}/knowledge/${article.slug ?? article.id}`;

  return <ArticleDetailClient article={article} relatedArticles={relatedArticles} canonicalUrl={canonicalUrl} />;
}
