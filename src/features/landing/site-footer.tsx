import { getTranslations, getLocale } from "next-intl/server";
import { ArrowRight, Heart } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Internal routes use the locale-aware Link; placeholder anchors use <a>. */
function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  const cls =
    "text-sm text-muted-foreground transition-colors hover:text-foreground";
  return href.startsWith("/") ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <a href={href} className={cls}>
      {children}
    </a>
  );
}

/** Giant brand wordmark, stretched to the full width and cropped at the base. */
function GiantWordmark() {
  return (
    <svg
      viewBox="0 0 1200 190"
      preserveAspectRatio="xMidYMin meet"
      className="w-full"
      aria-hidden="true"
    >
      <text
        x="600"
        y="235"
        textAnchor="middle"
        textLength="1180"
        lengthAdjust="spacingAndGlyphs"
        style={{
          fill: "var(--foreground)",
          fontFamily: "var(--font-app-sans), ui-sans-serif, sans-serif",
          fontWeight: 700,
          fontSize: 300,
          letterSpacing: "-0.03em",
        }}
        opacity={0.07}
      >
        naqd
      </text>
    </svg>
  );
}

export async function SiteFooter() {
  const t = await getTranslations("landing");
  const tn = await getTranslations("nav");
  const locale = (await getLocale()) as Locale;

  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t("colProduct"),
      links: [
        { label: tn("dashboard"), href: "/dashboard" },
        { label: tn("markets"), href: "/markets" },
        { label: tn("portfolio"), href: "/portfolio" },
        { label: tn("assistant"), href: "/assistant" },
        { label: tn("card"), href: "/card" },
      ],
    },
    {
      title: t("colCompany"),
      links: [
        { label: t("linkAbout"), href: "#" },
        { label: t("linkRoadmap"), href: "#" },
        { label: t("linkCareers"), href: "#" },
        { label: t("linkBlog"), href: "#" },
        { label: t("linkContact"), href: "#" },
      ],
    },
    {
      title: t("colLegal"),
      links: [
        { label: t("linkPrivacy"), href: "#" },
        { label: t("linkTerms"), href: "#" },
        { label: t("linkSecurity"), href: "#security" },
      ],
    },
    {
      title: t("colStart"),
      links: [
        { label: t("signIn"), href: "/login" },
        { label: t("createAccount"), href: "/register" },
        { label: t("download"), href: "#" },
      ],
    },
  ];

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-border bg-surface">
      <div className="mx-auto w-full max-w-[1180px] px-5 pt-16 sm:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand block */}
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {t("footerDescription")}
            </p>
            <Button asChild className="mt-5">
              <Link href="/register">
                {t("createAccount")}
                <ArrowRight className="h-4 w-4 rtl-flip" />
              </Link>
            </Button>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-sm font-semibold text-foreground">{col.title}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FooterLink href={l.href}>{l.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Meta row */}
        <div
          className={cn(
            "mt-14 flex flex-col items-start gap-3 border-t border-border pt-6",
            "text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <p className="tnum">{t("footerRights")}</p>
          <p className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 fill-brand text-brand" />
            {t("builtWith")}
          </p>
          <p className="max-w-sm text-subtle-foreground">{t("footer")}</p>
        </div>
      </div>

      {/* Giant brand wordmark — full width, cropped at the base */}
      <div
        dir="ltr"
        className="relative mt-8 select-none px-2 sm:px-4"
        aria-hidden="true"
      >
        <GiantWordmark />
      </div>
    </footer>
  );
}
