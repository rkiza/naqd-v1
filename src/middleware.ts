import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { routing } from "./i18n/routing";
import { navItems } from "./config/navigation";

const intlMiddleware = createIntlMiddleware(routing);

const protectedSlugs = new Set(navItems.map((item) => item.href));
const authSlugs = new Set(["/login", "/register"]);

function stripLocale(pathname: string): { locale: string; path: string } {
  const parts = pathname.split("/");
  const locale = parts[1] ?? "en";
  const path = "/" + parts.slice(2).join("/");
  return { locale, path: path === "/" ? "" : path.replace(/\/$/, "") || "/" };
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const { locale, path } = stripLocale(pathname);
  const isAuthed = !!req.auth?.user?.id;

  if (protectedSlugs.has(path) && !isAuthed) {
    const loginUrl = new URL(`/${locale}/login`, req.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (authSlugs.has(path) && isAuthed) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, req.url));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
