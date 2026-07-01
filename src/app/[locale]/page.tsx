import { setRequestLocale, getTranslations, getLocale } from "next-intl/server";
import {
  ArrowRight,
  Sparkles,
  CreditCard,
  TrendingUp,
  Languages,
  ShieldCheck,
  CandlestickChart,
} from "lucide-react";
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
import { card } from "@/data/finance";
import { formatCurrency, formatPercent } from "@/lib/format";

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

  const features = [
    { icon: CreditCard, title: t("feature1Title"), body: t("feature1Body") },
    { icon: TrendingUp, title: t("feature2Title"), body: t("feature2Body") },
    { icon: Sparkles, title: t("feature3Title"), body: t("feature3Body") },
    { icon: Languages, title: t("feature4Title"), body: t("feature4Body") },
  ];

  const stats = [
    { value: "48,000+", label: t("statsUsers") },
    { value: formatCurrency(214_000_000, lc, { compact: true }), label: t("statsInvested") },
    { value: "4.9 ★", label: t("statsRating") },
  ];

  return (
    <div className="min-h-dvh bg-background">
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
          <header className="flex h-20 items-center justify-between">
            <Logo className="[&_span]:text-white" />
            <nav className="hidden items-center gap-7 text-sm font-medium text-white/70 md:flex">
              <a href="#features" className="hover:text-white">{t("navFeatures")}</a>
              <a href="#markets" className="hover:text-white">{t("liveMarkets")}</a>
              <a href="#security" className="hover:text-white">{t("navSecurity")}</a>
            </nav>
            <div className="flex items-center gap-2">
              <LocaleSwitcher compact />
              <ThemeSwitcher />
              <Button asChild size="sm" variant="secondary" className="hidden bg-white text-[#06140a] hover:bg-white/90 sm:inline-flex">
                <Link href="/login">{t("signIn")}</Link>
              </Button>
            </div>
          </header>

          {/* Hero content */}
          <div className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-20">
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
              <div className="absolute -bottom-8 -start-4 w-44 rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg backdrop-blur-xl sm:-start-10">
                <p className="text-xs text-white/60">{tc("total")}</p>
                <p className="mt-0.5 text-lg font-semibold text-white tnum">
                  {formatCurrency(126850, lc, { compact: true })}
                </p>
                <div className="mt-1 text-xs font-medium text-brand" dir="ltr">
                  {formatPercent(11.5, lc, { signed: true })}
                </div>
                <Sparkline data={[96, 99, 98, 103, 109, 112, 118, 122, 127]} width={150} height={28} color="#52d400" />
              </div>
              <div className="absolute -end-3 -top-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 shadow-lg backdrop-blur-xl sm:-end-6">
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
        {/* ── Markets feature ───────────────────────────────────── */}
        <section id="markets" className="grid items-center gap-8 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-primary-strong">
              <CandlestickChart className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-foreground">
              {t("marketsTitle")}
            </h2>
            <p className="mt-3 max-w-md text-muted-foreground">{t("marketsBody")}</p>
            <Button asChild className="mt-6">
              <Link href="/markets">
                {t("openMarkets")}
                <ArrowRight className="h-4 w-4 rtl-flip" />
              </Link>
            </Button>
          </div>
          <div className="rounded-3xl border border-border bg-gradient-to-br from-brand-soft/50 to-card p-6 shadow-sm">
            <MarketsTicker />
            <div className="mt-2 grid grid-cols-2 gap-3">
              {["🇸🇦", "🇺🇸"].map((flag, i) => (
                <div key={flag} className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-2xl">{flag}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">
                    {i === 0 ? "TASI" : "S&P 500"}
                  </p>
                  <p className="text-xs font-medium text-positive tnum" dir="ltr">
                    {i === 0 ? "+0.74%" : "+0.42%"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────────── */}
        <section id="features" className="pb-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-primary-strong">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Security band ─────────────────────────────────────── */}
        <section
          id="security"
          className="mb-16 flex flex-col items-center gap-4 rounded-3xl border border-border bg-gradient-to-br from-brand-soft/60 to-card p-10 text-center"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-card text-primary shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h2 className="max-w-xl text-balance text-2xl font-semibold tracking-tight text-foreground">
            {t("trustedBy")}
          </h2>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/dashboard">
                {t("ctaPrimary")}
                <ArrowRight className="h-4 w-4 rtl-flip" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/register">{t("createAccount")}</Link>
            </Button>
          </div>
        </section>

        <footer className="flex flex-col items-center gap-4 border-t border-border py-8 text-center sm:flex-row sm:justify-between sm:text-start">
          <Logo />
          <p className="text-xs text-muted-foreground">{t("footer")}</p>
        </footer>
      </div>
    </div>
  );
}
