"use client";

import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Send, TrendingDown, TrendingUp } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { AnimatedCheck } from "@/components/ui/animated-check";
import { StockLogo } from "@/components/finance/stock-logo";
import { stockBySymbol } from "@/data/markets";
import { pick, type Localized } from "@/lib/localized";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/* Client-side mirrors of the server action shapes (the server module imports
 * prisma and must not be bundled into the client). */
export type SendMoneyPayload = {
  kind: "send_money";
  beneficiaryExtId: string;
  beneficiaryName: Localized;
  bank: Localized;
  ibanLast4: string;
  amount: number;
  note?: string;
  balanceBefore: number;
};

export type TradePayload = {
  kind: "buy_stock" | "sell_stock";
  symbol: string;
  name: Localized;
  market: "sa" | "us";
  units: number;
  price: number;
  currency: "SAR" | "USD";
  totalSar: number;
  cashBefore: number;
  unitsBefore: number;
};

export type ActionView = {
  id: string;
  type: "send_money" | "buy_stock" | "sell_stock";
  status: "pending" | "executed" | "declined" | "failed";
  payload: SendMoneyPayload | TradePayload;
  result?: {
    newBalance?: number;
    newCash?: number;
    unitsAfter?: number;
    reason?: string;
    detail?: string;
  } | null;
};

const reasonKeys: Record<string, string> = {
  insufficient_funds: "reasonInsufficientFunds",
  insufficient_cash: "reasonInsufficientCash",
  insufficient_units: "reasonInsufficientUnits",
  spend_not_allowed: "reasonSpendNotAllowed",
  over_spend_limit: "reasonOverSpendLimit",
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-end font-medium text-foreground">{children}</span>
    </div>
  );
}

/**
 * In-chat transaction card for an AI-proposed action. Renders the proposal
 * details and — while pending — Confirm / Cancel buttons. Nothing executes
 * until the user confirms; the card then flips to its final state.
 */
export function ActionCard({
  action,
  busy = false,
  onDecide,
}: {
  action: ActionView;
  busy?: boolean;
  onDecide: (decision: "confirm" | "decline") => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("assistant");
  const p = action.payload;
  const isSend = p.kind === "send_money";
  const isBuy = p.kind === "buy_stock";
  const stock = !isSend ? stockBySymbol(p.symbol) : undefined;

  const title = isSend
    ? t("actionSendTitle")
    : isBuy
      ? t("actionBuyTitle")
      : t("actionSellTitle");
  const Icon = isSend ? Send : isBuy ? TrendingUp : TrendingDown;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            isSend
              ? "bg-brand-soft text-primary-strong"
              : isBuy
                ? "bg-positive-soft text-positive"
                : "bg-negative-soft text-negative",
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="truncate text-xs text-muted-foreground">
            {action.status === "pending" ? t("awaitingConfirm") : null}
            {action.status === "executed" ? t("statusExecuted") : null}
            {action.status === "declined" ? t("statusDeclined") : null}
            {action.status === "failed" ? t("statusFailed") : null}
          </p>
        </div>
        {!isSend && stock && (
          <StockLogo domain={stock.domain} symbol={stock.symbol} color={stock.color} size={36} />
        )}
      </div>

      {/* Details */}
      <div className="space-y-2.5 px-4 py-3.5">
        {isSend ? (
          <>
            <Row label={t("actionTo")}>
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <span className="truncate">{pick(p.beneficiaryName, locale)}</span>
                <span dir="ltr" className="shrink-0 text-xs text-subtle-foreground tnum">
                  …{p.ibanLast4}
                </span>
              </span>
            </Row>
            {pick(p.bank, locale) && (
              <Row label={t("actionBank")}>{pick(p.bank, locale)}</Row>
            )}
            <Row label={t("actionAmount")}>
              <Money value={p.amount} locale={locale} />
            </Row>
            {p.note && <Row label={t("actionNote")}>{p.note}</Row>}
            <Row label={t("actionBalanceAfter")}>
              <Money
                value={
                  action.status === "executed" && action.result?.newBalance != null
                    ? action.result.newBalance
                    : p.balanceBefore - p.amount
                }
                locale={locale}
              />
            </Row>
          </>
        ) : (
          <>
            <Row label={t("actionStock")}>
              <span className="truncate">
                {pick(p.name, locale)}{" "}
                <span dir="ltr" className="text-xs text-subtle-foreground tnum">
                  {p.symbol}
                </span>
              </span>
            </Row>
            <Row label={t("actionUnits")}>
              <span className="tnum">{formatNumber(p.units, locale)}</span>
            </Row>
            <Row label={t("actionPrice")}>
              <Money value={p.price} locale={locale} currency={p.currency} />
            </Row>
            <Row label={t("actionTotal")}>
              <Money value={p.totalSar} locale={locale} />
            </Row>
            <Row label={t("actionCashAfter")}>
              <Money
                value={
                  action.status === "executed" && action.result?.newCash != null
                    ? action.result.newCash
                    : isBuy
                      ? p.cashBefore - p.totalSar
                      : p.cashBefore + p.totalSar
                }
                locale={locale}
              />
            </Row>
          </>
        )}
      </div>

      {/* Footer */}
      {action.status === "pending" && (
        <div className="flex gap-2 border-t border-border px-4 py-3">
          <Button
            size="sm"
            className="flex-1"
            disabled={busy}
            onClick={() => onDecide("confirm")}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("confirming")}
              </>
            ) : (
              t("confirm")
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            disabled={busy}
            onClick={() => onDecide("decline")}
          >
            {t("cancel")}
          </Button>
        </div>
      )}
      {action.status === "executed" && (
        <div className="flex items-center gap-2 border-t border-border bg-positive-soft/40 px-4 py-2.5 text-sm font-medium text-positive">
          <span className="h-5 w-5">
            <AnimatedCheck />
          </span>
          {t("executedNote")}
        </div>
      )}
      {action.status === "failed" && (
        <div className="border-t border-border bg-negative-soft/40 px-4 py-2.5 text-sm font-medium text-negative">
          {t(
            (action.result?.reason && reasonKeys[action.result.reason]) || "reasonGeneric",
          )}
        </div>
      )}
    </motion.div>
  );
}
