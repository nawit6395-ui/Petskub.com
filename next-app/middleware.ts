import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const legacyOrigin = process.env.LEGACY_APP_ORIGIN;
if (!legacyOrigin) {
  console.warn("[middleware] LEGACY_APP_ORIGIN is not set; non-native routes will 404");
} else {
  console.log("[middleware] Proxying legacy routes to", legacyOrigin);
}

const nativeRoutes: string[] = ["/"];

const isNativeRoute = (pathname: string) => {
  if (pathname === "/") {
    return nativeRoutes.includes("/");
  }

  return nativeRoutes.some((route) => {
    if (route === "/") return false;
    if (!pathname.startsWith(route)) return false;
    return pathname.length === route.length || pathname.startsWith(`${route}/`);
  });
};

const STATIC_EXTENSIONS = [
  ".txt",
  ".xml",
  ".json",
  ".webmanifest",
  ".ico",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".avif",
  ".woff",
  ".woff2",
  ".ttf",
];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  console.log("[middleware-test] hit", pathname, legacyOrigin);

  const isStaticAsset = STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    isStaticAsset
  ) {
    return NextResponse.next();
  }

  const rewriteUrl = new URL(pathname + search, request.url);
  console.log("[middleware-test] rewriting to", rewriteUrl.toString());
  return NextResponse.rewrite(new URL("/", request.url));
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
