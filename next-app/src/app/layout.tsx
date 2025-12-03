import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";

const siteTitle = "Petskub - ช่วยแมวและสุนัขจร ให้ได้บ้านที่อบอุ่น";
const siteDescription =
  "Petskub ชุมชนช่วยเหลือแมวและสุนัขจรในประเทศไทย ร่วมกันหาบ้านที่อบอุ่น ลดปัญหาสัตว์จรจัด";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
  metadataBase: new URL("https://petskub.com"),
  applicationName: "Petskub",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    other: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: "https://petskub.com/",
    siteName: "Petskub",
    type: "website",
    locale: "th_TH",
    images: [
      {
        url: "https://img5.pic.in.th/file/secure-sv1/LOGO_Petskub.png",
        width: 1200,
        height: 630,
        alt: "Petskub - ช่วยเหลือแมวและสุนัขจร",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@Petskub",
    title: siteTitle,
    description: siteDescription,
    images: ["https://img5.pic.in.th/file/secure-sv1/LOGO_Petskub.png"],
  },
  keywords: [
    "PetsKub",
    "รับเลี้ยงแมว",
    "รับเลี้ยงสุนัข",
    "สัตว์จรจัด",
    "หาบ้านให้น้องหมา",
    "หาบ้านให้น้องแมว",
    "ช่วยสัตว์จร",
    "อาสาสมัครดูแลสัตว์",
  ],
  authors: [{ name: "Petskub Community" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  category: "animals",
  alternates: {
    canonical: "https://petskub.com/",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4a259",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">
        <Script
          id="ld-json-organization"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "PetsKub",
              url: "https://petskub.com/",
              logo: "https://img5.pic.in.th/file/secure-sv1/LOGO_Petskub.png",
              description:
                "ชุมชนช่วยเหลือแมวและสุนัขจรในประเทศไทย ร่วมกันหาบ้านที่อบอุ่น ลดปัญหาสัตว์จรจัด",
              sameAs: [
                "https://facebook.com/PetsKub",
                "https://www.instagram.com/PetsKub",
                "https://twitter.com/PetsKub",
              ],
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                areaServed: "TH",
                availableLanguage: ["th", "en"],
              },
            }),
          }}
        />
        <SiteHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
