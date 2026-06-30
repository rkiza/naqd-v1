import { setRequestLocale, getTranslations } from "next-intl/server";
import { getLocale } from "next-intl/server";
import {
  ArrowRight,
  Sparkles,
  CreditCard,
  TrendingUp,
  Languages,
  ShieldCheck,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeSwitcher } from "@/components/layout/theme-switcher";
import { CardVisual } from "@/components/finance/card-visual";
import { Sparkline } from "@/components/charts/sparkline";
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
    <div className="relative min-h-dvh overflow-hidden bg-background">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[640px] bg-[radial-gradient(60%_60%_at_50%_0%,var(--brand-soft)_0%,transparent_70%)] opacity-70" />
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.35] [mask-image:radial-gradient(70%_50%_at_50%_0%,black,transparent)]" />

      <div className="relative mx-auto w-full max-w-[1180px] px-5 sm:px-8">
        {/* Header */}
        <header className="flex h-20 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">{t("navFeatures")}</a>
            <a href="#security" className="hover:text-foreground">{t("navSecurity")}</a>
          </nav>
          <div className="flex items-center gap-2">
            <LocaleSwitcher compact />
            <ThemeSwitcher />
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/dashboard">{t("openApp")}</Link>
            </Button>
          </div>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-12 py-12 lg:grid-cols-2 lg:py-20">
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
              <span className="h-2 w-2 rounded-full bg-primary" />
              {t("badge")}
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
              {t("title")}
            </h1>
            <p className="mt-5 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/dashboard">
                  {t("ctaPrimary")}
                  <ArrowRight className="h-4 w-4 rtl-flip" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">{t("ctaSecondary")}</a>
              </Button>
            </div>

            <div className="mt-12 grid max-w-md grid-cols-3 gap-6">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-semibold tracking-tight text-foreground tnum sm:text-2xl">
                    {s.value}
                  </p>
                  <p className="mt-1 text-xs leading-snug text-muted-foreground">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative mx-auto w-full max-w-md animate-scale-in">
            <div className="relative">
              <CardVisual
                holder={card.holder}
                last4={card.last4}
                expiry={card.expiry}
                network={card.network}
                label={t("badge").split("·")[0].trim()}
                className="rotate-[-3deg] shadow-2xl"
              />
              {/* Floating stat card */}
              <div className="absolute -bottom-8 -start-4 w-44 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur sm:-start-10">
                <p className="text-xs text-muted-foreground">{tc("total")}</p>
                <p className="mt-0.5 text-lg font-semibold text-foreground tnum">
                  {formatCurrency(126850, lc, { compact: true })}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs font-medium text-positive">
                  <span dir="ltr">{formatPercent(11.5, lc, { signed: true })}</span>
                </div>
                <Sparkline data={[96, 99, 98, 103, 109, 112, 118, 122, 127]} width={150} height={28} />
              </div>
              {/* Floating AI chip */}
              <div className="absolute -end-3 -top-5 flex items-center gap-2 rounded-2xl border border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur sm:-end-6">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                <span className="text-xs font-medium text-foreground">naqd AI</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-xs transition-shadow hover:shadow-md"
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-primary-strong">
                  <f.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Security band */}
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
          <Button asChild size="lg" className="mt-2">
            <Link href="/dashboard">
              {t("ctaPrimary")}
              <ArrowRight className="h-4 w-4 rtl-flip" />
            </Link>
          </Button>
        </section>

        <footer className="flex flex-col items-center gap-4 border-t border-border py-8 text-center sm:flex-row sm:justify-between sm:text-start">
          <Logo />
          <p className="text-xs text-muted-foreground">{t("footer")}</p>
        </footer>
      </div>
    </div>
  );
}
