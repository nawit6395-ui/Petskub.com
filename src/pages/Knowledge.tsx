import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Plus, PenSquare } from "lucide-react";
import { useArticles } from "@shared/hooks/useArticles";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useUserRole";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const Knowledge = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const { data: articles, isLoading } = useArticles();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ทั้งหมด");

  // Public page - no login required

  const categories = ["ทั้งหมด", "การดูแล", "สุขภาพ", "รับเลี้ยง", "โภชนาการ", "พฤติกรรม"];

  const filteredArticles = articles?.filter((article) => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "ทั้งหมด" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Count articles per category
  const getCategoryCount = (category: string) => {
    if (!articles) return 0;
    if (category === "ทั้งหมด") return articles.length;
    return articles.filter(article => article.category === category).length;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 font-prompt">ความรู้ก่อนรับเลี้ยงสัตว์ 📚</h1>
            <p className="text-muted-foreground font-prompt">
              บทความและคู่มือการดูแลแมวและสุนัขอย่างถูกวิธี – 5 สิ่งที่มือใหม่ต้องรู้ก่อนตัดสินใจรับเลี้ยงสุนัขและแมว
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => navigate("/knowledge/create")}
              className="font-prompt gap-2"
            >
              <Plus className="w-4 h-4" />
              สร้างบทความ
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="ค้นหาบทความ..."
              className="pl-12 h-12 font-prompt"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="font-prompt whitespace-nowrap"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat} <span className="ml-2 opacity-70">{getCategoryCount(cat)}</span>
            </Button>
          ))}
        </div>

        {/* Articles Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-prompt">กำลังโหลด...</p>
          </div>
        ) : filteredArticles && filteredArticles.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="rounded-[28px] border border-white/70 bg-white/95 shadow-card hover:shadow-hover transition-all">
                <div className="p-5 pb-0">
                  {article.image_url ? (
                    <div className="media-frame h-[190px] sm:h-[210px]">
                      <img
                        src={article.image_url}
                        alt={article.title}
                        loading="lazy"
                        width={640}
                        height={420}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="media-frame h-[190px] sm:h-[210px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <BookOpen className="w-8 h-8" />
                      <p className="text-xs font-prompt">ยังไม่มีภาพหน้าปก</p>
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <Badge variant="secondary" className="font-prompt">
                      {article.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2 font-prompt line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2 font-prompt">
                    {article.content.substring(0, 100)}...
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground font-prompt">
                      👁️ {article.views} ครั้ง
                    </span>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="font-prompt gap-1"
                        >
                          <Link to={`/knowledge/${article.id}/edit`}>
                            <PenSquare className="w-4 h-4" /> แก้ไข
                          </Link>
                        </Button>
                      )}
                      <Button
                        asChild
                        variant="default"
                        size="sm"
                        className="font-prompt bg-sunrise/10 text-sunrise border border-sunrise/20 hover:bg-sunrise/20"
                      >
                        <Link to={`/knowledge/${article.slug || article.id}`}>อ่านต่อ →</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-prompt">ไม่พบบทความที่ตรงกับเงื่อนไขการค้นหา</p>
          </div>
        )}

        {/* CTA */}
        <Card className="mt-12 p-8 bg-gradient-soft text-center">
          <h2 className="text-2xl font-bold mb-4 font-prompt">
            มีคำถามเกี่ยวกับการดูแลแมวหรือสุนัข?
          </h2>
          <p className="text-muted-foreground mb-6 font-prompt">
            ติดต่อทีมงานหรือเข้าร่วมกลุ่มชุมชนเพื่อสอบถามและแลกเปลี่ยนประสบการณ์
          </p>
          <Button size="lg" className="font-prompt">
            เข้าร่วมชุมชน
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Knowledge;
