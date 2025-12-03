import "server-only";

import { getServerSupabaseClient } from "@/lib/server/supabase-client";

export type KnowledgeArticle = {
  id: string;
  slug: string | null;
  title: string;
  category: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | string[] | null;
  image_url: string | string[] | null;
  image_alt: string | null;
  keywords: string[] | null;
  views: number | null;
  created_at: string;
  updated_at: string;
};

export type ArticleSummary = Pick<KnowledgeArticle, "id" | "slug" | "title" | "category" | "image_url" | "views">;

const ARTICLE_COLUMNS = [
  "id",
  "slug",
  "title",
  "category",
  "content",
  "meta_title",
  "meta_description",
  "og_title",
  "og_description",
  "og_image",
  "image_url",
  "image_alt",
  "keywords",
  "views",
  "created_at",
  "updated_at",
].join(", ");

const SUMMARY_COLUMNS = ["id", "slug", "title", "category", "image_url", "views"].join(", ");

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

export const getPublishedArticle = async (slugOrId: string): Promise<KnowledgeArticle | null> => {
  const client = getServerSupabaseClient();
  const identifier = slugOrId.trim();

  if (!identifier) {
    return null;
  }

  const primaryColumn = isUuid(identifier) ? "id" : "slug";
  const { data, error } = await client
    .from("knowledge_articles")
    .select(ARTICLE_COLUMNS)
    .eq(primaryColumn, identifier)
    .eq("published", true)
    .maybeSingle<KnowledgeArticle>();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching article", error.message);
    throw error;
  }

  if (data) {
    return data;
  }

  const { data: fallbackData, error: fallbackError } = await client
    .from("knowledge_articles")
    .select(ARTICLE_COLUMNS)
    .eq(primaryColumn === "id" ? "slug" : "id", identifier)
    .eq("published", true)
    .maybeSingle<KnowledgeArticle>();

  if (fallbackError && fallbackError.code !== "PGRST116") {
    console.error("Error fetching article fallback", fallbackError.message);
    throw fallbackError;
  }

  return fallbackData ?? null;
};

export const getRelatedArticles = async (
  category: string | null,
  excludeId: string,
  limit = 3,
): Promise<ArticleSummary[]> => {
  if (!category) {
    return [];
  }

  const client = getServerSupabaseClient();
  const { data, error } = await client
    .from("knowledge_articles")
    .select(SUMMARY_COLUMNS)
    .eq("published", true)
    .eq("category", category)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(limit)
    .returns<ArticleSummary[]>();

  if (error) {
    console.error("Error fetching related articles", error.message);
    throw error;
  }

  return data ?? [];
};

export const incrementArticleViewCount = async (articleId: string) => {
  try {
    const client = getServerSupabaseClient();
    const { error } = await client.rpc("increment_article_views", { article_id: articleId });
    if (error) {
      console.error("Error incrementing article views", error.message);
    }
  } catch (error) {
    console.error("Unexpected error incrementing article views", error);
  }
};
