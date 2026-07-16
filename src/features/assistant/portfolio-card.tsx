"use client";

import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { LineChart } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Money } from "@/components/ui/money";
import { Delta } from "@/components/ui/trend";
import { StockLogo } from "@/components/finance/stock-logo";
import { stockBySymbol } from "@/data/markets";
import { pick, type Localized } from "@/lib/localized";
import { formatNumber } from "@/lib/format";

export type PortfolioCardData = {
  cash: number;
  totalSar: number;
  positions: Array<{
    symbol: string;
    name: Localized;
    market: "sa" | "us";
    currency: "SAR" | "USD";
    units: number;
    avgCost: number;
    price: number;
    valueSar: number;
    plPercent: number;
  }>;
};

/** In-chat holdings card rendered when the assistant lists the user's stocks. */
export function PortfolioCard({ data }: { data: PortfolioCardData }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("assistant");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-xs"
    >
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong">
          <LineChart className="h-4.5 w-4.5" />
        </span>
        <p className="text-sm font-semibold text-foreground">{t("portfolioTitle")}</p>
      </div>

      <div className="divide-y divide-border">
        {data.positions.length === 0 && (
          <p className="px-4 py-4 text-sm text-muted-foreground">{t("noPositions")}</p>
        )}
        {data.positions.map((p) => {
          const stock = stockBySymbol(p.symbol);
          return (
            <div key={p.symbol} className="flex items-center gap-3 px-4 py-2.5">
              {stock ? (
                <StockLogo
                  domain={stock.domain}
                  symbol={stock.symbol}
                  color={stock.color}
                  size={34}
                />
              ) : (
                <span className="h-[34px] w-[34px] shrink-0 rounded-xl bg-surface-muted" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {pick(p.name, locale)}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="tnum" dir="ltr">
                    {formatNumber(p.units, locale)}
                  </span>{" "}
                  × <Money value={p.price} locale={locale} currency={p.currency} className="text-xs" />
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <Money value={p.valueSar} locale={locale} decimals={0} className="text-sm font-semibold" />
                <Delta value={p.plPercent} withBackground={false} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5 border-t border-border bg-surface-muted/50 px-4 py-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("positionsValue")}</span>
          <Money value={data.totalSar} locale={locale} decimals={0} className="font-medium" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("tradingCash")}</span>
          <Money value={data.cash} locale={locale} decimals={0} className="font-medium" />
        </div>
      </div>
    </motion.div>
  );
}
