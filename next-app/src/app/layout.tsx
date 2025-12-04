import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const siteUrl = "https://petskub.com";
const siteName = "PetsKub";
const siteTitle = "PetsKub - ช่วยแมวและสุนัขจร ให้ได้บ้านที่อบอุ่น";
const siteDescription = "PetsKub ชุมชนช่วยเหลือแมวและสุนัขจรในประเทศไทย ร่วมกันหาบ้านที่อบอุ่น ลดปัญหาสัตว์จรจัด";
const ogImage = "https://img5.pic.in.th/file/secure-sv1/LOGO_Petskub.png";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | PetsKub",
  },
  description: siteDescription,
  applicationName: siteName,
  keywords: [
    "PetsKub",
    "รับเลี้ยงแมว",
    "รับเลี้ยงสุนัข",
    "สัตว์จรจัด",
    "ช่วยสัตว์จร",
    "อาสาสมัครดูแลสัตว์",
  ],
  authors: [{ name: "Petskub Community" }],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: siteTitle,
    description: siteDescription,
    siteName,
    images: [{ url: ogImage, width: 1200, height: 630, alt: siteTitle }],
    locale: "th_TH",
  },
  twitter: {
    card: "summary_large_image",
    site: "@Petskub",
    title: siteTitle,
    description: siteDescription,
    images: [ogImage],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport = {
  themeColor: "#f4a259",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: ogImage,
  description: siteDescription,
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <Navbar />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <Script id="organization-ld-json" type="application/ld+json" suppressHydrationWarning>
          {JSON.stringify(organizationJsonLd)}
        </Script>
      </body>
    </html>
  );
}
