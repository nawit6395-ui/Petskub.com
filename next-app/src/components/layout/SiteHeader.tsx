"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import Logo from "@/legacy/assets/Logo.png";

const navLinks = [
  { href: "/", label: "หน้าแรก" },
  { href: "/adopt", label: "หาบ้านให้สัตว์เลี้ยง" },
  { href: "/success-stories", label: "เรื่องราวความสำเร็จ" },
  { href: "/report", label: "แจ้งเจอสัตว์จร" },
  { href: "/help", label: "ช่วยเหลือด่วน" },
  { href: "/knowledge", label: "ความรู้" },
  { href: "/forum", label: "เว็บบอร์ด" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3" aria-label="Petskub homepage">
          <Image src={Logo} alt="Petskub" width={56} height={56} priority className="h-12 w-auto" />
          <span className="hidden font-prompt text-2xl text-primary sm:inline">Petskub</span>
        </Link>

        <nav className="hidden gap-3 md:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-primary transition hover:bg-muted md:hidden"
          aria-label="สลับเมนูนำทาง"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/70 bg-white/95 md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-2xl px-4 py-3 text-base font-semibold transition ${
                    active ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
