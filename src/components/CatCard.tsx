import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Heart, MessageCircle, Eye, Check, RotateCcw, ShieldCheck, Share2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { ImageGallery } from "@/components/ImageGallery";
import { useDeleteCat, useUpdateCat } from "@shared/hooks/useCats";
import { useIsAdmin } from "@/hooks/useUserRole";
import { alert } from "@/lib/alerts";
import { useCreateConversation } from "@/hooks/useConversations";
import { useNavigate } from "react-router-dom";
import { FaFacebookF, FaLine, FaXTwitter } from "react-icons/fa6";
import { Link2 } from "lucide-react";

interface CatCardProps {
  id?: string;
  name: string;
  age: string;
  province: string;
  district?: string;
  image?: string[];
  images?: string[];
  story?: string;
  gender: "ชาย" | "หญิง" | "ไม่ระบุ";
  isAdopted?: boolean;
  urgent?: boolean;
  contactName?: string;
  contactPhone?: string;
  contactLine?: string;
  userId?: string;
  healthStatus?: string;
  isSterilized?: boolean;
}

const CatCard = ({ id, name, age, province, district, image, images, story, gender, isAdopted, urgent, contactName, contactPhone, contactLine, userId, healthStatus, isSterilized }: CatCardProps) => {
  const { user } = useAuth();
  const [showContact, setShowContact] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const updateCat = useUpdateCat();
  const deleteCat = useDeleteCat();
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const createConversation = useCreateConversation();

  const isOwner = user?.id === userId;
  const canManageStatus = isOwner || isAdmin;
  const canStartChat = Boolean(id && userId && !isOwner && !isAdopted);

  const handleMarkAsAdopted = async () => {
    if (!id || !canManageStatus) return;
    try {
      await updateCat.mutateAsync({ id, is_adopted: true });
      alert.success('🎉 ยินดีด้วย!', {
        description: `${name} ได้บ้านใหม่แล้ว ขอบคุณที่ให้ความรักกับน้อง ๆ`
      });
    } catch (error) {
      alert.error('เกิดข้อผิดพลาด', {
        description: 'ไม่สามารถอัพเดทสถานะได้'
      });
    }
  };

  const handleMarkAsAvailable = async () => {
    if (!id || !canManageStatus) return;
    try {
      await updateCat.mutateAsync({ id, is_adopted: false });
      alert.success('อัพเดทสถานะสำเร็จ', {
        description: `${name} พร้อมรับเลี้ยงอีกครั้ง`
      });
    } catch (error) {
      alert.error('เกิดข้อผิดพลาด', {
        description: 'ไม่สามารถอัพเดทสถานะได้'
      });
    }
  };

  const handleDeleteCat = async () => {
    if (!id || deleteCat.isPending) return;
    const result = await alert.confirm("ต้องการลบประกาศนี้หรือไม่?", {
      description: "เมื่อลบแล้วจะไม่สามารถกู้คืนได้",
      confirmText: "ลบประกาศ",
    });
    if (result.isConfirmed) {
      deleteCat.mutate(id, {
        onSuccess: () => {
          alert.success("ลบประกาศแล้ว");
        },
        onError: (error) => {
          alert.error("ลบไม่สำเร็จ", {
            description: error.message,
          });
        },
      });
    }
  };

  const buildShareUrl = () => {
    if (typeof window === "undefined") return "";
    // ใช้ /share/pet/{id} เพื่อให้ Social Media อ่าน OG Image ได้
    return id ? `${window.location.origin}/share/pet/${id}` : `${window.location.origin}/adopt`;
  };

  const buildDirectUrl = () => {
    if (typeof window === "undefined") return "";
    // URL ตรงไปหน้า adopt
    return id ? `${window.location.origin}/adopt?pet=${id}` : `${window.location.origin}/adopt`;
  };

  const buildShareText = () =>
    `ช่วยกันแชร์ให้น้อง${name}ได้บ้านใหม่\n• อายุ: ${age}\n• พื้นที่: ${province}${district ? ` - ${district}` : ""}\n• สุขภาพ: ${healthStatus || "แข็งแรง"}\nติดต่อ: ${contactName || "เจ้าของ"}${contactPhone ? ` (${contactPhone})` : ""}`.trim();

  const shareOnFacebook = () => {
    if (typeof window === "undefined") return;
    const url = buildShareUrl();
    if (!url) return;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const shareOnLine = () => {
    if (typeof window === "undefined") return;
    const url = buildShareUrl();
    if (!url) return;
    const text = buildShareText();
    const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const shareOnTwitter = () => {
    if (typeof window === "undefined") return;
    const url = buildShareUrl();
    if (!url) return;
    const text = `ช่วยกันแชร์ให้น้อง${name}ได้บ้านใหม่ 🐾\nอายุ: ${age} | พื้นที่: ${province}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

  const handleNativeShare = async () => {
    if (typeof navigator === "undefined") return;
    const url = buildShareUrl();
    const text = buildShareText();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ช่วยหาบ้านให้น้อง${name}`,
          text: text,
          url: url,
        });
      } catch (error) {
        // User cancelled or error
        console.log('Share cancelled or failed:', error);
      }
    } else {
      // Fallback to copy
      copyShareLink();
    }
  };

  const copyShareLink = async () => {
    if (typeof navigator === "undefined") return;
    const url = buildShareUrl();
    const text = `${buildShareText()}\n${url}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert.success("คัดลอกข้อความสำหรับแชร์แล้ว");
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (error) {
      alert.error("คัดลอกไม่สำเร็จ", {
        description: (error as Error)?.message || "พยายามอีกครั้ง",
      });
    }
  };
  
  // Use new images array if available, fallback to old image prop
  const displayImages = images && images.length > 0 
    ? images 
    : (image && Array.isArray(image) 
      ? image 
      : (typeof image === 'string' ? [image] : []));
  const firstImage = displayImages[0] || '/placeholder.svg';
  
  return (
    <>
      <Card className={`overflow-hidden border-none rounded-[28px] bg-white/95 shadow-[0_15px_35px_rgba(15,23,42,0.08)] hover:shadow-[0_20px_45px_rgba(15,23,42,0.12)] transition-all duration-300 ${isAdopted ? 'relative' : ''}`}>
        <div
          className={`media-frame w-full aspect-[360/220] ${
            isAdopted ? 'ring-2 ring-success/30' : ''
          }`}
        >
          <img 
            src={firstImage} 
            alt={`${name} - ${gender === 'ชาย' ? 'น้องหมา' : gender === 'หญิง' ? 'น้องแมว' : 'สัตว์เลี้ยง'}หาบ้าน ${province}${district ? ` ${district}` : ''} อายุ ${age}`}
            loading="lazy"
            width={360}
            height={220}
            className={`h-full w-full object-cover transition duration-300 ${displayImages.length > 1 ? 'cursor-pointer hover:scale-[1.02]' : ''} ${isAdopted ? 'brightness-75' : ''}`}
            onClick={() => displayImages.length > 1 && setGalleryOpen(true)}
          />
          
          {/* Adopted Overlay */}
          {isAdopted && (
            <div className="absolute inset-0 bg-gradient-to-t from-success/90 via-success/50 to-transparent flex items-center justify-center">
              <div className="text-center text-white">
                <Check className="w-12 h-12 mx-auto mb-2" />
                <p className="text-xl font-bold font-prompt">รับเลี้ยงแล้ว</p>
                <p className="text-sm font-prompt">Happy Ending 🎉</p>
              </div>
            </div>
          )}

          {displayImages.length > 1 && (
            <Badge 
              className="absolute bottom-3 left-3 bg-white/90 text-foreground border-0 font-prompt cursor-pointer z-10 text-[11px] px-2.5 py-0.5 shadow-sm"
              onClick={() => setGalleryOpen(true)}
            >
              📷 {displayImages.length}
            </Badge>
          )}

          {isAdmin && id && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 text-destructive hover:text-destructive"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteCat();
              }}
              disabled={deleteCat.isPending}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">ลบประกาศ</span>
            </Button>
          )}

          {urgent && !isAdopted && (
            <Badge className="absolute top-3 right-3 bg-gradient-to-r from-rose-500 to-orange-500 text-white border-0 font-prompt animate-pulse text-[11px] px-2.5 py-0.5 shadow-soft">
              ⚠️ ด่วน
            </Badge>
          )}
        </div>

      <div className="p-3 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-prompt text-primary">
              <Heart className="w-3 h-3" /> กำลังหาบ้าน
            </div>
            <h3 className="mt-1 font-semibold text-base sm:text-lg font-prompt text-slate-900">{name}</h3>
          </div>
          <div className="flex gap-1 flex-wrap">
            <Badge variant="secondary" className="font-prompt text-[11px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {gender}
            </Badge>
            {isSterilized && (
              <Badge variant="outline" className="font-prompt text-[10px] sm:text-xs px-1.5 py-0 bg-success/10 text-success border-success/20">
                ✓
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground font-prompt">
            <MapPin className="w-3 h-3 flex-shrink-0 text-primary" />
            <span className="truncate">{province}{district ? ` • ${district}` : ''}</span>
          </div>
          <div className="text-xs sm:text-sm text-slate-600 font-prompt">
            อายุ: <span className="font-medium text-slate-900">{age}</span>
          </div>
          {healthStatus && (
            <div className="text-xs sm:text-sm text-slate-600 font-prompt truncate">
              สุขภาพ: <span className="font-medium text-slate-900">{healthStatus}</span>
            </div>
          )}
        </div>
        
        {story && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 font-prompt bg-slate-50/80 rounded-2xl px-3 py-2">
            {story}
          </p>
        )}

        {user && showContact && contactPhone && (
          <div className="bg-muted/50 rounded-lg p-2 mb-2">
            <p className="text-[10px] sm:text-xs font-semibold mb-0.5 font-prompt">ติดต่อ:</p>
            {contactName && <p className="text-xs font-prompt">{contactName}</p>}
            <p className="text-xs font-prompt">📱 {contactPhone}</p>
            {contactLine && <p className="text-xs font-prompt">LINE: {contactLine}</p>}
          </div>
        )}
        
        <div className="flex flex-col gap-2">
          {/* Status Management for Owner and Admin */}
          {canManageStatus && (
            <div className="flex flex-col sm:flex-row gap-2">
              {!isAdopted ? (
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={handleMarkAsAdopted}
                  disabled={updateCat.isPending}
                  className="flex-1 font-prompt gap-1 text-[10px] sm:text-xs h-7 sm:h-8 bg-success hover:bg-success/90"
                >
                  <Check className="w-3 h-3" />
                  {updateCat.isPending ? 'บันทึก...' : 'รับเลี้ยงแล้ว'}
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={handleMarkAsAvailable}
                  disabled={updateCat.isPending}
                  className="flex-1 font-prompt gap-1 text-[10px] sm:text-xs h-7 sm:h-8"
                >
                  <RotateCcw className="w-3 h-3" />
                  {updateCat.isPending ? 'บันทึก...' : 'เปิดรับเลี้ยงอีกครั้ง'}
                </Button>
              )}
              {isAdmin && (
                <Badge variant="secondary" className="font-prompt gap-1 px-2 text-[10px] sm:text-xs">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </Badge>
              )}
            </div>
          )}
          
          {/* Contact Buttons */}
          {!isAdopted && (
            <div className="flex flex-col sm:flex-row gap-2">
              {!showContact ? (
                <Button 
                  size="sm"
                  className="flex-1 font-prompt gap-2 text-xs sm:text-sm min-h-[44px] sm:min-h-[48px] rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 text-white shadow-[0_10px_24px_rgba(249,115,22,0.3)] hover:scale-[1.01]" 
                  onClick={() => {
                    if (!user) {
                      alert.error('กรุณาเข้าสู่ระบบเพื่อดูข้อมูลติดต่อ');
                      return;
                    }
                    setShowContact(true);
                  }}
                >
                  <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">แสดงข้อมูลติดต่อ</span>
                  <span className="sm:hidden">ติดต่อ</span>
                </Button>
              ) : (
                <Button 
                  size="sm"
                  className="flex-1 font-prompt gap-2 text-xs sm:text-sm min-h-[44px] sm:min-h-[48px] rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 text-white shadow-[0_10px_24px_rgba(16,185,129,0.35)] hover:scale-[1.01]" 
                  asChild
                >
                  <a href={`tel:${contactPhone}`}>
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">ติดต่อรับเลี้ยง</span>
                    <span className="sm:hidden">โทร</span>
                  </a>
                </Button>
              )}
              {canStartChat && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 font-prompt gap-2 text-xs sm:text-sm min-h-[44px] sm:min-h-[48px] rounded-2xl border-primary/20 text-primary bg-white shadow-[0_10px_18px_rgba(59,130,246,0.18)] hover:bg-primary/5"
                  disabled={createConversation.isPending}
                  onClick={() => {
                    if (!user) {
                      alert.error('กรุณาเข้าสู่ระบบเพื่อเริ่มแชท');
                      navigate('/login');
                      return;
                    }
                    if (!id || !userId) {
                      alert.error('ไม่พบข้อมูลเจ้าของสัตว์เลี้ยง');
                      return;
                    }
                    createConversation.mutate(
                      { catId: id, ownerId: userId, adopterId: user.id },
                      {
                        onSuccess: (conversation) => {
                          alert.success('เปิดห้องแชทกับเจ้าของแล้ว');
                          navigate(`/chat?conversationId=${conversation.id}`);
                        },
                      }
                    );
                  }}
                >
                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">แชทกับเจ้าของ</span>
                  <span className="sm:hidden">แชท</span>
                </Button>
              )}
              <div className="flex flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 font-prompt gap-2 text-[11px] sm:text-sm leading-snug text-center min-h-[44px] sm:min-h-[48px] rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50 to-white text-amber-600 shadow-[0_10px_24px_rgba(251,191,36,0.25)] hover:bg-amber-50"
                      aria-label="แชร์ช่วยหาบ้าน"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="hidden sm:inline">แชร์</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-56 rounded-2xl border border-amber-100 bg-white shadow-xl p-3 space-y-2">
                    <p className="text-xs font-prompt text-slate-500 mb-2">แชร์ช่วยน้อง{name}หาบ้าน</p>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        type="button"
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-blue-50 transition-colors"
                        onClick={shareOnFacebook}
                        title="แชร์ Facebook"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
                          <FaFacebookF className="text-base" />
                        </span>
                        <span className="text-[10px] font-prompt text-slate-600">Facebook</span>
                      </button>
                      <button
                        type="button"
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-green-50 transition-colors"
                        onClick={shareOnLine}
                        title="แชร์ LINE"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white shadow-md">
                          <FaLine className="text-lg" />
                        </span>
                        <span className="text-[10px] font-prompt text-slate-600">LINE</span>
                      </button>
                      <button
                        type="button"
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                        onClick={shareOnTwitter}
                        title="แชร์ X"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-white shadow-md">
                          <FaXTwitter className="text-base" />
                        </span>
                        <span className="text-[10px] font-prompt text-slate-600">X</span>
                      </button>
                      <button
                        type="button"
                        className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-amber-50 transition-colors"
                        onClick={copyShareLink}
                        title="คัดลอกลิงก์"
                      >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 shadow-md">
                          <Link2 className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] font-prompt text-slate-600">คัดลอก</span>
                      </button>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-2.5 text-sm font-prompt text-white shadow-md hover:shadow-lg transition-shadow"
                        onClick={handleNativeShare}
                      >
                        <Share2 className="w-4 h-4" />
                        แชร์ผ่านแอปอื่น
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          {/* Adopted Status Info */}
          {isAdopted && !canManageStatus && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-2 text-center">
              <p className="text-xs sm:text-sm font-semibold text-success font-prompt">
                ✨ น้อง{name}ได้บ้านใหม่แล้ว
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground font-prompt mt-0.5">
                ขอบคุณทุกคนที่ให้ความสนใจ
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>

      {displayImages.length > 0 && (
        <ImageGallery 
          images={displayImages}
          open={galleryOpen}
          onOpenChange={setGalleryOpen}
        />
      )}
    </>
  );
};

export default CatCard;
