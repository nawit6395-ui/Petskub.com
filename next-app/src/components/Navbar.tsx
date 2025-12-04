"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { path: "/", iconClass: "fa-solid fa-house", color: "#2E8BFD", label: "หน้าแรก" },
  { path: "/adopt", iconClass: "fa-solid fa-magnifying-glass", color: "#F472B6", label: "หาบ้านให้สัตว์เลี้ยง" },
  { path: "/success-stories", iconClass: "fa-solid fa-wand-magic-sparkles", color: "#F59E0B", label: "เรื่องราวความสำเร็จ" },
  { path: "/report", iconClass: "fa-solid fa-location-dot", color: "#22C55E", label: "แจ้งเจอสัตว์จร" },
  { path: "/help", iconClass: "fa-solid fa-triangle-exclamation", color: "#EF4444", label: "ช่วยเหลือด่วน" },
  { path: "/knowledge", iconClass: "fa-solid fa-book-open", color: "#A855F7", label: "ความรู้" },
  { path: "/forum", iconClass: "fa-regular fa-comments", color: "#F97316", label: "เว็บบอร์ด" },
];

const quickAction = { path: "/report", label: "แจ้งสัตว์จรทันที" };

const getNavClasses = (active: boolean) =>
  cn(
    "group flex items-center gap-2 rounded-2xl px-3 py-2 text-base font-nav font-bold tracking-wide transition-all",
    active ? "bg-white text-foreground shadow-sm border border-primary/10" : "text-muted-foreground hover:bg-white/60 hover:text-foreground",
  );

const Navbar = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-[2200] border-b border-border/70 bg-white shadow-sm md:bg-gradient-to-b md:from-white/95 md:to-white/80 md:backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-3 py-3">
          <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3 rounded-3xl border border-white/60 bg-white/80 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.08)] md:flex md:flex-wrap md:justify-between">
            <div className="md:hidden flex items-center">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary text-primary-foreground shadow-[0_5px_15px_rgba(244,162,89,0.18)] transition hover:scale-105 hover:bg-primary-hover"
                aria-label="เปิดเมนูนำทาง"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>

            <Link
              href="/"
              className="flex items-center justify-center gap-3 sm:gap-4 font-bold text-xl text-primary"
              aria-label="Petskub homepage"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image
                src="/Logo.png"
                alt="Petskub logo"
                width={64}
                height={64}
                className="h-12 w-auto drop-shadow-[0_6px_18px_rgba(249,115,22,0.4)] sm:h-14 lg:h-16"
                priority
              />
              <span className="font-prompt text-xl sm:text-2xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 text-transparent bg-clip-text hidden lg:inline">
                Petskub
              </span>
            </Link>

            <div className="hidden md:flex flex-1 flex-wrap items-center justify-center gap-2 px-3 min-w-0">
              {navLinks.map((link) => (
                <Link key={link.path} href={link.path} className="focus-visible:outline-none" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className={getNavClasses(isActive(link.path))} aria-current={isActive(link.path) ? "page" : undefined}>
                    <span
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full"
                      style={{ backgroundColor: `${link.color}1f`, color: link.color, minWidth: "1rem" }}
                    >
                      <i className={`${link.iconClass} text-base`} aria-hidden="true" />
                    </span>
                    {link.label}
                  </Button>
                </Link>
              ))}
            </div>

            <Button
              asChild
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 px-4 py-2 font-prompt text-white shadow-[0_10px_25px_rgba(234,88,12,0.4)] hover:scale-[1.02]"
            >
              <Link href={quickAction.path}>
                <MapPin className="h-4 w-4" />
                {quickAction.label}
              </Link>
            </Button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden rounded-3xl border border-white/70 bg-white/95 p-4 shadow-[0_20px_40px_rgba(15,23,42,0.15)]">
              <div className="space-y-3">
                {navLinks.map((link) => (
                  <Link key={link.path} href={link.path} onClick={() => setMobileMenuOpen(false)}>
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border border-gray-100 bg-white/90 px-3 py-2 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
                        isActive(link.path) && "border-primary/40 shadow-[0_12px_30px_rgba(244,162,89,0.25)]",
                      )}
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-xl" style={{ color: link.color }}>
                        <i className={link.iconClass} aria-hidden="true" />
                      </span>
                      <span className="text-base font-semibold text-foreground flex-1">{link.label}</span>
                      {isActive(link.path) && <span className="text-xs font-bold text-primary">กำลังดู</span>}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-6 rounded-3xl bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 p-1 shadow-[0_15px_30px_rgba(234,88,12,0.35)]">
                <Button asChild className="w-full rounded-3xl bg-transparent font-prompt text-white hover:bg-white/10" onClick={() => setMobileMenuOpen(false)}>
                  <Link href={quickAction.path}>
                    <div className="flex items-center justify-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {quickAction.label}
                    </div>
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
