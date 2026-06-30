"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Percent } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { CashflowBars } from "@/components/charts/bar-chart";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Delta } from "@/components/ui/trend";
import {
  cashflow,
  spendingByCategory,
  monthlySpend,
  monthlyIncome,
} from "@/data/finance";
import { categories } from "@/data/categories";
import { pick } from "@/lib/localized";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";

export function AnalyticsScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("analytics");

  const net = monthlyIncome - monthlySpend;
  const savingsRate = (net / monthlyIncome) * 100;
  const avgExpense =
    cashflow.reduce((s, c) => s + c.expense, 0) / cashflow.length;

  return (
    <div className="space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label={t("income")}
          accent="var(--positive)"
          icon={<ArrowDownLeft className="h-4 w-4" />}
          value={formatCurrency(monthlyIncome, locale, { decimals: 0 })}
        />
        <StatCard
          label={t("expenses")}
          accent="var(--negative)"
          icon={<ArrowUpRight className="h-4 w-4" />}
          value={formatCurrency(monthlySpend, locale, { decimals: 0 })}
        />
        <StatCard
          label={t("netSavings")}
          accent="var(--brand)"
          icon={<PiggyBank className="h-4 w-4" />}
          value={formatCurrency(net, locale, { decimals: 0 })}
        />
        <StatCard
          label={t("savingsRate")}
          accent="var(--info)"
          icon={<Percent className="h-4 w-4" />}
          value={formatPercent(savingsRate, locale, { decimals: 0 })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Cashflow */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div>
              <CardTitle>{t("incomeVsExpense")}</CardTitle>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("monthlyAverage")}: {formatCurrency(avgExpense, locale, { decimals: 0, compact: true })}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-muted-foreground">{t("income")}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
                <span className="text-muted-foreground">{t("expenses")}</span>
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <CashflowBars
              data={cashflow}
              height={260}
              formatValue={(v) => formatCurrency(v, locale, { decimals: 0 })}
              formatLabel={(tt) => formatDate(`${tt}-01`, locale, { month: "short" })}
            />
          </CardContent>
        </Card>

        {/* Spending by category */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("spendingByCategory")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {spendingByCategory.slice(0, 7).map((s) => {
              const cat = categories[s.category];
              const share = (s.amount / monthlySpend) * 100;
              return (
                <div key={s.category}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: `color-mix(in oklab, ${cat.color} 16%, transparent)`, color: cat.color }}
                    >
                      <DynamicIcon name={cat.icon} className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 truncate text-sm text-foreground">
                      {pick(cat.name, locale)}
                    </span>
                    <span className="text-sm font-medium text-foreground tnum">
                      {formatCurrency(s.amount, locale, { decimals: 0 })}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2 ps-9">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${share}%`, backgroundColor: cat.color }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-end text-xs text-muted-foreground tnum">
                      {formatPercent(share, locale, { decimals: 0 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
