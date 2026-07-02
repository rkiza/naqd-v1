import { setRequestLocale, getTranslations, getLocale } from "next-intl/server";
import { ArrowRight, Sparkles, CreditCard, CandlestickChart } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { CardVisual } from "@/components/finance/card-visual";
import { Sparkline } from "@/components/charts/sparkline";
import ColorBends from "@/components/react-bits/color-bends";
import { MarketsTicker } from "@/features/landing/markets-ticker";
import { LandingMobileMenu } from "@/features/landing/mobile-menu";
import { BrowserFrame, PhoneFrame } from "@/features/landing/mockups";
import { SloganSection } from "@/features/landing/slogan-section";
import { SiteFooter } from "@/features/landing/site-footer";
import { card } from "@/data/finance";
import { formatPercent } from "@/lib/format";
import { Money } from "@/components/ui/money";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");
  const lc = (await getLocale()) as Locale;

  const stats = [
    { value: "48,000+", label: t("statsUsers") },
    { value: <Money value={214_000_000} locale={lc} compact />, label: t("statsInvested") },
    { value: "4.9 ★", label: t("statsRating") },
  ];

  return (
    <div className="min-h-dvh overflow-x-clip bg-background">
      {/* ── Hero (dark, ColorBends) ─────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#06140a] text-white">
        <ColorBends
          className="h-full w-full opacity-90"
          style={{ position: "absolute", inset: 0 }}
          colors={["#04220e", "#16a34a", "#52d400", "#07160b"]}
          speed={0.16}
          scale={1.15}
          transparent={false}
        />
        <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_-10%,transparent_20%,#06140a_78%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#06140a]" />

        <div className="relative mx-auto w-full max-w-[1180px] px-5 sm:px-8">
          {/* Header */}
          <header className="flex h-20 items-center justify-between pt-[env(safe-area-inset-top)]">
            <Logo className="[&_span]:text-white" />
            <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex">
              <a href="#preview" className="hover:text-white">{t("navFeatures")}</a>
              <a href="#markets" className="hover:text-white">{t("liveMarkets")}</a>
            </nav>
            <div className="flex items-center gap-2">
              <LocaleSwitcher compact />
              <ThemeSwitcher />
              <Button asChild size="sm" variant="secondary" className="hidden bg-white text-[#06140a] hover:bg-white/90 md:inline-flex">
                <Link href="/login">{t("signIn")}</Link>
              </Button>
              <LandingMobileMenu />
            </div>
          </header>

          {/* Hero content */}
          <div className="grid items-center gap-12 py-14 lg:grid-cols-2 lg:py-24">
            <div className="animate-fade-up">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-brand" />
                {t("badge")}
              </span>
              <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                {t("title")}
              </h1>
              <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-white/70 sm:text-lg">
                {t("subtitle")}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg">
                  <Link href="/dashboard">
                    {t("ctaPrimary")}
                    <ArrowRight className="h-4 w-4 rtl-flip" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="border border-white/25 bg-white/5 text-white hover:bg-white/10"
                >
                  <Link href="/register">{t("createAccount")}</Link>
                </Button>
              </div>

              <div className="mt-12 grid max-w-md grid-cols-3 gap-6">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-xl font-semibold tracking-tight tnum sm:text-2xl">{s.value}</p>
                    <p className="mt-1 text-xs leading-snug text-white/60">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative mx-auto w-full max-w-md animate-scale-in">
              <CardVisual
                holder={card.holder}
                last4={card.last4}
                expiry={card.expiry}
                network={card.network}
                label={t("badge").split("·")[0].trim()}
                className="rotate-[-3deg] shadow-2xl"
              />
              <div className="absolute -bottom-8 start-0 w-44 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur-xl sm:-start-6">
                <p className="text-xs text-white/60">{tc("total")}</p>
                <p className="mt-0.5 text-lg font-semibold text-white">
                  <Money value={126850} locale={lc} compact />
                </p>
                <div className="mt-1 text-xs font-medium text-brand" dir="ltr">
                  {formatPercent(11.5, lc, { signed: true })}
                </div>
                <Sparkline data={[96, 99, 98, 103, 109, 112, 118, 122, 127]} width={150} height={28} color="#52d400" />
              </div>
              <div className="absolute -top-5 end-0 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 shadow-lg backdrop-blur-xl sm:-end-4">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-medium text-white">naqd AI</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Live markets ticker ─────────────────────────────────── */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
          <div className="flex items-center gap-2 pt-4 text-xs font-semibold uppercase tracking-wider text-subtle-foreground">
            <span className="h-2 w-2 animate-pulse rounded-full bg-positive" />
            {t("liveMarkets")}
          </div>
        </div>
        <MarketsTicker />
      </section>

      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-8">
        {/* ── Slogan (three worlds → one place) ──────────────────── */}
        <SloganSection />

        {/* ── Product preview ───────────────────────────────────── */}
        <section id="preview" className="py-20 text-center lg:py-28">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-strong">
            {t("previewBadge")}
          </span>
          <h2 className="mx-auto mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("previewTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-balance text-muted-foreground">
            {t("previewSubtitle")}
          </p>
          <div className="relative mt-12">
            <div className="pointer-events-none absolute inset-x-0 -top-6 mx-auto h-64 max-w-3xl rounded-full bg-brand/15 blur-3xl" />
            <BrowserFrame
              src="/mockups/dashboard.png"
              alt="naqd dashboard"
              className="relative mx-auto max-w-4xl"
            />
          </div>
        </section>

        {/* ── Showcase: Markets ─────────────────────────────────── */}
        <ShowcaseRow
          icon={<CandlestickChart className="h-5 w-5" />}
          title={t("marketsTitle")}
          body={t("marketsBody")}
          cta={{ href: "/markets", label: t("openMarkets") }}
          media={<BrowserFrame src="/mockups/markets.png" alt="naqd markets" url="naqd.sa/markets" />}
        />

        {/* ── Showcase: AI Assistant (reversed) ─────────────────── */}
        <ShowcaseRow
          reverse
          icon={<Sparkles className="h-5 w-5" />}
          title={t("showcaseAiTitle")}
          body={t("showcaseAiBody")}
          cta={{ href: "/assistant", label: t("tryIt") }}
          media={<BrowserFrame src="/mockups/assistant.png" alt="naqd AI assistant" url="naqd.sa/assistant" />}
        />

        {/* ── Showcase: Card (phone) ────────────────────────────── */}
        <ShowcaseRow
          icon={<CreditCard className="h-5 w-5" />}
          title={t("showcaseCardTitle")}
          body={t("showcaseCardBody")}
          cta={{ href: "/card", label: t("tryIt") }}
          media={
            <div className="flex justify-center">
              <PhoneFrame src="/mockups/card.png" alt="naqd virtual card" />
            </div>
          }
        />

        <div className="pb-8" />
      </div>

      <SiteFooter />
    </div>
  );
}

/** Alternating image + copy showcase row. */
function ShowcaseRow({
  icon,
  title,
  body,
  cta,
  media,
  reverse = false,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  cta: { href: string; label: string };
  media: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="grid items-center gap-10 border-t border-border py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
      <div className={reverse ? "lg:order-2" : undefined}>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-primary-strong">
          {icon}
        </span>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-3 max-w-md text-muted-foreground">{body}</p>
        <Button asChild className="mt-6">
          <Link href={cta.href}>
            {cta.label}
            <ArrowRight className="h-4 w-4 rtl-flip" />
          </Link>
        </Button>
      </div>
      <div className={reverse ? "lg:order-1" : undefined}>{media}</div>
    </section>
  );
}
