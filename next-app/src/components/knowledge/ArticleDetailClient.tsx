"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CheckCheck, Copy, Eye, Facebook, Share2, Twitter } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ArticleSummary, KnowledgeArticle } from "@/lib/server/articles";

type ContentBlock =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "divider" };

const trimHeadingLabel = (text: string) => text.replace(/^H[1-6]:\s*/i, "").trim();

const parseArticleContent = (rawContent?: string): ContentBlock[] => {
  if (!rawContent) return [];

  const lines = rawContent.split("\n");
  const blocks: ContentBlock[] = [];
  let currentList: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (currentList && currentList.items.length) {
      blocks.push({ type: "list", ordered: currentList.ordered, items: [...currentList.items] });
    }
    currentList = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      continue;
    }

    const markdownHeading = trimmed.match(/^(#{2,4})\s+(.*)$/);
    if (markdownHeading) {
      flushList();
      const level = markdownHeading[1].length as 2 | 3 | 4;
      blocks.push({ type: "heading", level, text: markdownHeading[2].trim() });
      continue;
    }

    const semanticHeading = trimmed.match(/^H([2-4]):\s*(.*)$/i);
    if (semanticHeading) {
      flushList();
      const level = Math.min(4, Math.max(2, Number(semanticHeading[1]))) as 2 | 3 | 4;
      blocks.push({ type: "heading", level, text: trimHeadingLabel(trimmed) });
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushList();
      blocks.push({ type: "quote", text: trimmed.replace(/^>\s*/, "").trim() });
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-•]\s+(.*)$/);
    if (unorderedMatch) {
      if (!currentList || currentList.ordered) {
        flushList();
        currentList = { ordered: false, items: [] };
      }
      currentList.items.push(unorderedMatch[1].trim());
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (orderedMatch) {
      if (!currentList || !currentList.ordered) {
        flushList();
        currentList = { ordered: true, items: [] };
      }
      currentList.items.push(orderedMatch[2].trim());
      continue;
    }

    if (trimmed === "---") {
      flushList();
      blocks.push({ type: "divider" });
      continue;
    }

    flushList();
    blocks.push({ type: "paragraph", text: trimmed });
  }

  flushList();
  return blocks;
};

const renderInlineText = (paragraph: string, keyPrefix: string) => {
  const parts = paragraph.split(/(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g);
  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${keyPrefix}-strong-${index}`} className="text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`${keyPrefix}-em-${index}`} className="text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }

    const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
    if (linkMatch) {
      return (
        <a
          key={`${keyPrefix}-link-${index}`}
          href={linkMatch[2]}
          className="font-semibold text-emerald-600 underline-offset-4 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <React.Fragment key={`${keyPrefix}-text-${index}`}>{part}</React.Fragment>;
  });
};

const pickImage = (value: string | string[] | null | undefined) => {
  if (!value) return null;
  if (Array.isArray(value)) {
    return value.find((item) => typeof item === "string" && item.trim().length > 0) ?? null;
  }
  return typeof value === "string" && value.trim().length > 0 ? value : null;
};

const fallbackShareImage =
  "https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1200&q=80";

type ArticleDetailClientProps = {
  article: KnowledgeArticle;
  relatedArticles: ArticleSummary[];
  canonicalUrl: string;
};

export const ArticleDetailClient: React.FC<ArticleDetailClientProps> = ({ article, relatedArticles, canonicalUrl }) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window === "undefined" ? canonicalUrl : window.location.href;
  const viewCount = (article.views ?? 0) + 1;

  const contentBlocks = useMemo(() => parseArticleContent(article.content), [article.content]);
  const firstParagraphIndex = useMemo(
    () => contentBlocks.findIndex((block) => block.type === "paragraph"),
    [contentBlocks],
  );

  const handleShare = (platform: "facebook" | "twitter" | "line" | "copy") => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(article.title);

    switch (platform) {
      case "facebook":
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank");
        break;
      case "twitter":
        window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`, "_blank");
        break;
      case "line":
        window.open(`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`, "_blank");
        break;
      case "copy":
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          });
        } else {
          const fallbackInput = document.createElement("input");
          fallbackInput.value = shareUrl;
          document.body.appendChild(fallbackInput);
          fallbackInput.select();
          document.execCommand("copy");
          document.body.removeChild(fallbackInput);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
        break;
    }
  };

  const resolvedHero = pickImage(article.image_url) ?? fallbackShareImage;

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <nav className="mb-6 font-prompt text-sm">
          <ol className="flex items-center gap-2 text-muted-foreground">
            <li>
              <Link href="/" className="hover:text-foreground">
                หน้าแรก
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/knowledge" className="hover:text-foreground">
                ความรู้
              </Link>
            </li>
            <li>/</li>
            <li className="text-foreground">{article.title}</li>
          </ol>
        </nav>

        <article className="mb-8">
          <header className="mb-6">
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary" className="font-prompt">
                {article.category}
              </Badge>
              <span className="flex items-center gap-1 text-sm font-prompt text-muted-foreground">
                <Eye className="h-4 w-4" />
                {viewCount} ครั้ง
              </span>
            </div>

            <h1 className="mb-4 font-prompt text-4xl font-bold">{article.title}</h1>

            {article.meta_description && (
              <p className="font-prompt text-lg text-muted-foreground">{article.meta_description}</p>
            )}

            {article.keywords && article.keywords.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {article.keywords.map((keyword, index) => (
                  <Badge key={`${keyword}-${index}`} variant="outline" className="font-prompt">
                    #{keyword}
                  </Badge>
                ))}
              </div>
            )}
          </header>

          {resolvedHero && (
            <div className="media-frame mb-6 h-[220px] w-full overflow-hidden rounded-3xl sm:h-[320px] lg:h-[420px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolvedHero}
                alt={article.image_alt || article.title}
                loading="lazy"
                width={960}
                height={540}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <Card className="mb-6 border border-emerald-100 bg-white/90 p-0 shadow-none">
            <div className="flex flex-col gap-4 rounded-3xl border border-white/70 bg-gradient-to-r from-white via-emerald-50/60 to-white p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 font-prompt text-slate-800">
                <span className="rounded-2xl bg-white p-3 text-emerald-500 shadow-inner shadow-white">
                  <Share2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm uppercase tracking-wide text-slate-500">แชร์บทความนี้</p>
                  <p className="text-lg font-semibold">ชวนเพื่อนช่วยเหลือแมวและสุนัขด้วยกัน</p>
                </div>
              </div>
              <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:grid-cols-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("facebook")}
                  className="group h-11 gap-2 rounded-full border border-blue-100 bg-blue-50/30 font-prompt text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <Facebook className="h-4 w-4 text-[#1877F2] transition group-hover:text-[#0c60c7]" />
                  Facebook
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("twitter")}
                  className="group h-11 gap-2 rounded-full border border-slate-100 bg-white font-prompt text-sm font-semibold text-slate-800 transition hover:border-slate-200 hover:bg-white"
                >
                  <Twitter className="h-4 w-4 text-[#1DA1F2] transition group-hover:text-[#0d8ad4]" />
                  Twitter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("line")}
                  className="group h-11 gap-2 rounded-full border border-emerald-100 bg-emerald-50/40 font-prompt text-sm font-semibold text-slate-800 transition hover:border-emerald-200 hover:bg-emerald-50"
                >
                  <svg
                    className="h-4 w-4 text-[#00B900] transition group-hover:text-emerald-500"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                  LINE
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleShare("copy")}
                  className="group h-11 gap-2 rounded-full border border-slate-200 bg-white font-prompt text-sm font-semibold text-slate-800 transition hover:border-emerald-200 hover:bg-white"
                >
                  {copied ? (
                    <CheckCheck className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-slate-500 transition group-hover:text-emerald-500" />
                  )}
                  {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="mb-8 border-0 bg-white p-0 shadow-none">
            <div className="rounded-3xl border border-slate-100 bg-gradient-to-b from-white via-white to-emerald-50/40 p-8 shadow-card">
              <div className="space-y-6 font-prompt text-slate-700">
                {contentBlocks.map((block, index) => {
                  if (block.type === "heading") {
                    const baseClass =
                      block.level === 2 ? "text-3xl" : block.level === 3 ? "text-2xl" : "text-xl";
                    return (
                      <h2
                        key={`heading-${index}`}
                        className={`${baseClass} scroll-mt-24 border-l-4 border-emerald-200 pl-4 font-semibold text-slate-900`}
                      >
                        {block.text}
                      </h2>
                    );
                  }

                  if (block.type === "paragraph") {
                    const dropCap = index === firstParagraphIndex;
                    return (
                      <p
                        key={`paragraph-${index}`}
                        className={`text-lg leading-8 text-slate-700 ${dropCap ? "first-letter:float-left first-letter:mr-3 first-letter:text-5xl first-letter:font-bold first-letter:text-emerald-500" : ""}`}
                      >
                        {renderInlineText(block.text, `paragraph-${index}`)}
                      </p>
                    );
                  }

                  if (block.type === "list") {
                    const ListTag = block.ordered ? "ol" : "ul";
                    return (
                      <ListTag
                        key={`list-${index}`}
                        className={`space-y-2 ${block.ordered ? "list-decimal" : "list-disc"} pl-6 text-lg text-slate-700`}
                      >
                        {block.items.map((item, itemIndex) => (
                          <li key={`list-${index}-${itemIndex}`} className="marker:text-emerald-500">
                            {renderInlineText(item, `list-${index}-${itemIndex}`)}
                          </li>
                        ))}
                      </ListTag>
                    );
                  }

                  if (block.type === "quote") {
                    return (
                      <blockquote
                        key={`quote-${index}`}
                        className="rounded-2xl border border-emerald-100 bg-white px-6 py-4 text-lg italic text-slate-600 shadow-inner"
                      >
                        <span className="text-3xl text-emerald-400">“</span>
                        {renderInlineText(block.text, `quote-${index}`)}
                        <span className="text-3xl text-emerald-400">”</span>
                      </blockquote>
                    );
                  }

                  if (block.type === "divider") {
                    return <Separator key={`divider-${index}`} className="my-8" />;
                  }

                  return null;
                })}
              </div>
            </div>
          </Card>

          <div className="mb-8 flex justify-start">
            <Button
              onClick={() => router.push("/knowledge")}
              className="border border-emerald-600 bg-emerald-600 font-prompt text-white hover:bg-emerald-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              กลับไปหน้าความรู้
            </Button>
          </div>
        </article>

        {relatedArticles.length > 0 && (
          <section>
            <Separator className="mb-6" />
            <h2 className="mb-6 font-prompt text-2xl font-bold">บทความที่เกี่ยวข้อง</h2>
            <div className="-mx-4 flex gap-4 overflow-x-auto pb-2 pl-4 pr-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
              {relatedArticles.map((related) => {
                const cover = pickImage(related.image_url);
                const targetUrl = `/knowledge/${related.slug ?? related.id}`;
                return (
                  <Card
                    key={related.id}
                    className="min-w-[240px] cursor-pointer flex-shrink-0 rounded-[22px] border border-white/70 bg-white/95 shadow-card transition-all hover:shadow-hover sm:min-w-0"
                    onClick={() => router.push(targetUrl)}
                  >
                    <div className="p-4 pb-0">
                      {cover ? (
                        <div className="media-frame-sm h-[150px] overflow-hidden rounded-2xl">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={cover}
                            alt={related.title}
                            loading="lazy"
                            width={480}
                            height={320}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="media-frame-sm flex h-[150px] flex-col items-center justify-center gap-2 rounded-2xl bg-emerald-50 text-muted-foreground">
                          <BookOpen className="h-6 w-6" />
                          <p className="text-[10px] font-prompt">ไม่มีภาพหน้าปก</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <Badge variant="secondary" className="font-prompt mb-2">
                        {related.category}
                      </Badge>
                      <h3 className="mb-2 line-clamp-2 font-prompt text-sm font-semibold">{related.title}</h3>
                      <span className="flex items-center gap-1 text-xs font-prompt text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        {related.views ?? 0} ครั้ง
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
