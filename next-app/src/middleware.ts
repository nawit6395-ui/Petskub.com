import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const legacyOrigin =
  process.env.LEGACY_APP_ORIGIN ?? process.env.NEXT_PUBLIC_LEGACY_APP_ORIGIN;

if (!legacyOrigin) {
  console.warn(
    "[middleware] LEGACY_APP_ORIGIN is not set; non-native routes will 404"
  );
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

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (isNativeRoute(pathname) || !legacyOrigin) {
    return NextResponse.next();
  }

  const rewriteUrl = new URL(pathname + search, legacyOrigin);
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
