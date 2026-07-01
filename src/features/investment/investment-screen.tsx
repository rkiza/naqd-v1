"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Repeat,
  BadgeCheck,
  Wallet,
  Unlock,
  ShieldCheck,
  ArrowUpRight,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card, CardBody, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { investmentProducts } from "@/data/content";
import { pick } from "@/lib/localized";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";

const riskTone = { low: "positive", medium: "warning", high: "negative" } as const;

export function InvestmentScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("investment");
  const tr = useTranslations("risk");

  const benefits = [
    { icon: Wallet, title: t("benefit1"), body: t("benefit1Body") },
    { icon: ShieldCheck, title: t("benefit2"), body: t("benefit2Body") },
    { icon: Unlock, title: t("benefit3"), body: t("benefit3Body") },
  ];

  return (
    <div className="space-y-6">
      {/* Auto-invest */}
      <Card className="relative overflow-hidden border-primary/30 bg-gradient-to-br from-brand-soft/70 via-card to-card">
        <div className="pointer-events-none absolute -end-10 -top-10 h-40 w-40 rounded-full bg-brand/20 blur-3xl" />
        <CardBody className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <Repeat className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-semibold text-foreground">{t("autoInvest")}</p>
                <Badge tone="positive">
                  {t("autoInvestActive", {
                    date: formatDate("2026-07-21", locale, { day: "numeric", month: "short" }),
                  })}
                </Badge>
              </div>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {t("autoInvestBody")}
              </p>
            </div>
          </div>
          <Button variant="outline">{t("explore")}</Button>
        </CardBody>
      </Card>

      {/* Opportunities */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-foreground">{t("opportunities")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {investmentProducts.map((p) => (
            <Card key={p.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-10 w-10 place-items-center rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: p.color }}
                    dir="ltr"
                  >
                    {pick(p.name, "en").slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {pick(p.name, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pick(p.category, locale)}
                    </p>
                  </div>
                </div>
                <Badge tone={riskTone[p.risk]}>{tr(p.risk)}</Badge>
              </div>

              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                {pick(p.description, locale)}
              </p>

              <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">{t("expectedReturn")}</p>
                  <p className="text-lg font-semibold text-positive tnum" dir="ltr">
                    {formatPercent(p.expectedReturn, locale, { decimals: 1 })}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      {t("perYear")}
                    </span>
                  </p>
                </div>
                <div className="text-end">
                  <p className="text-xs text-muted-foreground">{t("minimum")}</p>
                  <p className="text-sm font-medium text-foreground tnum">
                    {formatCurrency(p.minInvestment, locale, { decimals: 0 })}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" className="flex-1">
                  {t("invest")}
                  <ArrowUpRight className="h-4 w-4 rtl-flip" />
                </Button>
                {p.shariah && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-positive-soft px-2.5 py-2 text-xs font-medium text-positive">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    {t("shariah")}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Why naqd */}
      <Card>
        <CardHeader>
          <CardTitle>{t("whyNaqd")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.title} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong">
                <b.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{b.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {b.body}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="px-1 text-center text-xs text-subtle-foreground">{t("riskNote")}</p>
    </div>
  );
}
