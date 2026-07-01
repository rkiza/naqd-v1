"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Star, ArrowUpDown, Plus } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Delta } from "@/components/ui/trend";
import { AreaChart } from "@/components/charts/area-chart";
import { Sparkline } from "@/components/charts/sparkline";
import { StockLogo } from "@/components/finance/stock-logo";
import { markets, stocksFor, stockBySymbol, type MarketId, type Stock } from "@/data/markets";
import { useMarket, SAR_PER_USD } from "./store";
import { TradeDialog } from "./trade-dialog";
import { pick } from "@/lib/localized";
import { Money } from "@/components/ui/money";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MarketsScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("markets");
  const { cash, positions, watchlist, toggleWatch, orders } = useMarket();

  const [market, setMarket] = useState<MarketId>("sa");
  const [trade, setTrade] = useState<{ stock: Stock; side: "buy" | "sell" } | null>(null);

  const meta = markets[market];
  const list = useMemo(() => stocksFor(market), [market]);
  const currency = meta.currency;

  // Positions value in SAR across all markets.
  const positionsValue = useMemo(() => {
    return Object.entries(positions).reduce((sum, [sym, pos]) => {
      const s = stockBySymbol(sym);
      if (!s) return sum;
      const fx = s.market === "us" ? SAR_PER_USD : 1;
      return sum + pos.units * s.price * fx;
    }, 0);
  }, [positions]);

  const ownedList = useMemo(
    () =>
      Object.entries(positions)
        .map(([sym, pos]) => ({ stock: stockBySymbol(sym)!, pos }))
        .filter((x) => x.stock),
    [positions],
  );

  const money = (v: number, cur = currency, decimals = 2) => (
    <Money value={v} locale={locale} currency={cur} decimals={decimals} />
  );

  const indexData = meta.series.map((v, i) => ({ t: String(i), v }));

  function openTrade(stock: Stock, side: "buy" | "sell") {
    setTrade({ stock, side });
  }

  return (
    <div className="space-y-6">
      {/* Market selector bar */}
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-1.5">
        {(Object.values(markets) as (typeof markets)[MarketId][]).map((m) => {
          const active = m.id === market;
          return (
            <button
              key={m.id}
              onClick={() => setMarket(m.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                active
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              <span className="text-base leading-none">{m.flag}</span>
              <span>{pick(m.label, locale)}</span>
              <span className={cn("text-xs font-normal", active ? "text-background/70" : "text-subtle-foreground")}>
                {pick(m.index, locale)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Index hero + stats */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">
                  {pick(meta.index, locale)}
                </p>
                <span className="inline-flex items-center gap-1 rounded-full bg-positive-soft px-2 py-0.5 text-[0.7rem] font-medium text-positive">
                  <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                  {t("open")}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-3xl font-semibold tracking-tight text-foreground tnum">
                  {formatNumber(meta.indexValue, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <Delta value={meta.indexChange} />
              </div>
            </div>
          </div>
          <div className="mt-2">
            <AreaChart
              data={indexData}
              height={200}
              color={meta.indexChange >= 0 ? "var(--brand)" : "var(--negative)"}
              formatValue={(v) => formatNumber(v, locale, { maximumFractionDigits: 0 })}
            />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
          <Card className="p-5">
            <p className="text-sm font-medium text-muted-foreground">{t("portfolioValue")}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground tnum">
              {money(positionsValue, "SAR", 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground tnum">
              {ownedList.length} {t("holdings")}
            </p>
          </Card>
          <Card className="flex flex-col p-5">
            <p className="text-sm font-medium text-muted-foreground">{t("buyingPower")}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground tnum">
              {money(cash, "SAR", 0)}
            </p>
            <button className="mt-auto inline-flex items-center gap-1 pt-2 text-xs font-medium text-primary-strong hover:underline">
              <Plus className="h-3.5 w-3.5" />
              {t("addFunds")}
            </button>
          </Card>
        </div>
      </div>

      {/* Your positions */}
      {ownedList.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("yourPositions")}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4">
            <div className="space-y-0.5">
              {ownedList.map(({ stock, pos }) => {
                const cur = stock.market === "us" ? "USD" : "SAR";
                const value = pos.units * stock.price;
                const ret = ((stock.price - pos.avgCost) / pos.avgCost) * 100;
                return (
                  <button
                    key={stock.symbol}
                    onClick={() => openTrade(stock, "sell")}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors hover:bg-surface-muted"
                  >
                    <StockLogo domain={stock.domain} symbol={stock.symbol} color={stock.color} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {pick(stock.name, locale)}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground tnum" dir="ltr">
                        {formatNumber(pos.units, locale)} {t("unit")} · {t("avgCost")}{" "}
                        <Money value={pos.avgCost} locale={locale} currency={cur} decimals={2} />
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="flex justify-end text-sm font-semibold text-foreground">
                        <Money value={value} locale={locale} currency={cur} decimals={0} />
                      </p>
                      <Delta value={ret} withBackground={false} />
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stocks table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {pick(meta.label, locale)} · {t("allStocks")}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {list.length} {t("allStocks").toLowerCase()}
          </span>
        </CardHeader>
        <CardContent className="px-2 sm:px-3">
          <div className="space-y-0.5">
            {list.map((stock) => {
              const watched = watchlist.includes(stock.symbol);
              return (
                <div
                  key={stock.symbol}
                  className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-muted"
                >
                  <button
                    onClick={() => toggleWatch(stock.symbol)}
                    aria-label={t("watchlist")}
                    className="shrink-0"
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 transition-colors",
                        watched ? "fill-warning text-warning" : "text-subtle-foreground hover:text-warning",
                      )}
                    />
                  </button>
                  <StockLogo domain={stock.domain} symbol={stock.symbol} color={stock.color} size={40} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {pick(stock.name, locale)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {stock.symbol} · {pick(stock.sector, locale)}
                    </p>
                  </div>
                  <div className="hidden sm:block">
                    <Sparkline
                      data={stock.series}
                      width={80}
                      height={32}
                      color={stock.change >= 0 ? "var(--positive)" : "var(--negative)"}
                    />
                  </div>
                  <div className="w-24 text-end">
                    <p className="text-sm font-semibold text-foreground tnum" dir="ltr">
                      {money(stock.price)}
                    </p>
                    <Delta value={stock.change} withBackground={false} />
                  </div>
                  <Button
                    size="sm"
                    variant="subtle"
                    className="hidden shrink-0 sm:inline-flex"
                    onClick={() => openTrade(stock, "buy")}
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    {t("trade")}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle>{t("recentOrders")}</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("noOrders")}</p>
          ) : (
            <div className="space-y-0.5">
              {orders.slice(0, 6).map((o) => {
                const s = stockBySymbol(o.symbol);
                if (!s) return null;
                const cur = s.market === "us" ? "USD" : "SAR";
                return (
                  <div key={o.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold",
                        o.side === "buy" ? "bg-positive-soft text-positive" : "bg-negative-soft text-negative",
                      )}
                    >
                      {o.side === "buy" ? t("buy")[0] : t("sell")[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {pick(s.name, locale)}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground tnum" dir="ltr">
                        {formatNumber(o.units, locale)} {t("unit")} @{" "}
                        <Money value={o.price} locale={locale} currency={cur} decimals={2} />
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      <Money value={o.units * o.price} locale={locale} currency={cur} decimals={0} />
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TradeDialog
        stock={trade?.stock ?? null}
        open={!!trade}
        onClose={() => setTrade(null)}
        initialSide={trade?.side ?? "buy"}
      />
    </div>
  );
}
