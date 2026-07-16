"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Download, Loader2, Send, TrendingDown, TrendingUp } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { CountUpMoney } from "@/components/ui/count-up-money";
import { AnimatedCheck } from "@/components/ui/animated-check";
import { LogoMark } from "@/components/brand/logo";
import { StockLogo } from "@/components/finance/stock-logo";
import { stockBySymbol } from "@/data/markets";
import { pick, type Localized } from "@/lib/localized";
import { formatDate, formatNumber, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
/** How long the success animation plays before the card morphs into a receipt. */
const RECEIPT_DELAY_MS = 1700;

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
  /** Set once executed — shown on the receipt. */
  executedAt?: string | null;
};

const reasonKeys: Record<string, string> = {
  insufficient_funds: "reasonInsufficientFunds",
  insufficient_cash: "reasonInsufficientCash",
  insufficient_units: "reasonInsufficientUnits",
  spend_not_allowed: "reasonSpendNotAllowed",
  over_spend_limit: "reasonOverSpendLimit",
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-end font-medium text-foreground">{children}</span>
    </div>
  );
}

/**
 * In-chat transaction card for an AI-proposed action. Renders the proposal
 * details and — while pending — Confirm / Cancel buttons. On confirmation the
 * success animation plays (check draw + confetti + ring flash), then the card
 * morphs into a printed-receipt view. Cards reloaded from history mount
 * straight on the receipt, with no celebration.
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

  // Celebrate only a live pending → executed flip — never on history reloads,
  // where the card mounts already executed (and goes straight to the receipt).
  const prevStatus = useRef(action.status);
  const [celebrate, setCelebrate] = useState(false);
  const [showReceipt, setShowReceipt] = useState(action.status === "executed");
  useEffect(() => {
    const was = prevStatus.current;
    prevStatus.current = action.status;
    if (was === "pending" && action.status === "executed") {
      setCelebrate(true);
      const timer = setTimeout(() => setShowReceipt(true), RECEIPT_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [action.status]);

  const title = isSend
    ? t("actionSendTitle")
    : isBuy
      ? t("actionBuyTitle")
      : t("actionSellTitle");
  const Icon = isSend ? Send : isBuy ? TrendingUp : TrendingDown;
  const statusLabel =
    action.status === "pending"
      ? t("awaitingConfirm")
      : action.status === "executed"
        ? t("statusExecuted")
        : action.status === "declined"
          ? t("statusDeclined")
          : t("statusFailed");

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: EASE }}
      className="relative w-full max-w-sm"
    >
      {/* A soft green ring that fades off the card on a live confirmation. */}
      {celebrate && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-2 ring-positive/60 ring-inset"
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      )}

      <AnimatePresence initial={false} mode="wait">
        {showReceipt && action.status === "executed" ? (
          /* ── Receipt view — slides down like it's being printed ── */
          <motion.div
            key="receipt"
            initial={{ opacity: 0, y: -22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <ReceiptView action={action} locale={locale} />
          </motion.div>
        ) : (
          /* ── Proposal / confirmation view ── */
          <motion.div
            key="form"
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeIn" }}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs"
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
                <AnimatePresence initial={false} mode="wait">
                  <motion.p
                    key={action.status}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className={cn(
                      "truncate text-xs",
                      action.status === "executed"
                        ? "font-medium text-positive"
                        : "text-muted-foreground",
                    )}
                  >
                    {statusLabel}
                  </motion.p>
                </AnimatePresence>
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

            {/* Footer — animated swap: buttons → success / failure strip. */}
            <AnimatePresence initial={false} mode="wait">
              {action.status === "pending" ? (
                <motion.div
                  key="pending"
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.16, ease: "easeIn" }}
                  className="flex gap-2 border-t border-border px-4 py-3"
                >
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
                </motion.div>
              ) : action.status === "executed" ? (
                <motion.div
                  key="executed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="flex items-center gap-2 border-t border-border bg-positive-soft/40 px-4 py-2.5 text-sm font-medium text-positive"
                >
                  <motion.span
                    className="h-5 w-5 shrink-0"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 20, delay: 0.05 }}
                  >
                    <AnimatedCheck />
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.18, ease: EASE }}
                  >
                    {t("executedNote")}
                  </motion.span>
                </motion.div>
              ) : action.status === "failed" ? (
                <motion.div
                  key="failed"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, ease: EASE }}
                  className="border-t border-border bg-negative-soft/40 px-4 py-2.5 text-sm font-medium text-negative"
                >
                  {t(
                    (action.result?.reason && reasonKeys[action.result.reason]) || "reasonGeneric",
                  )}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────── Receipt ─────────────────────────── */

function ReceiptRow({
  label,
  children,
  index,
}: {
  label: string;
  children: ReactNode;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 + index * 0.07, duration: 0.26, ease: EASE }}
      className="flex items-center justify-between gap-3 text-xs"
    >
      <span className="text-muted-foreground">{label}</span>
      <span className="min-w-0 text-end font-medium text-foreground">{children}</span>
    </motion.div>
  );
}

/** Torn-paper bottom edge — filled triangles with an outlined tear line so the
 * receipt visibly "ends" even when the page behind matches the paper color. */
function Sawtooth() {
  const W = 336;
  const TEETH = 16;
  const tw = W / TEETH;
  let fill = `M0 0 H${W} `;
  let line = "M0 0 ";
  for (let x = W; x > 0.5; x -= tw) {
    fill += `L${(x - tw / 2).toFixed(1)} 10 L${(x - tw).toFixed(1)} 0 `;
  }
  fill += "Z";
  for (let x = 0; x < W - 0.5; x += tw) {
    line += `L${(x + tw / 2).toFixed(1)} 10 L${(x + tw).toFixed(1)} 0 `;
  }
  return (
    <svg
      viewBox={`0 0 ${W} 11.5`}
      preserveAspectRatio="none"
      className="block h-2.5 w-full"
      aria-hidden
    >
      <path d={fill} style={{ fill: "var(--surface)" }} />
      <path
        d={line}
        fill="none"
        style={{ stroke: "var(--border)" }}
        strokeWidth={1.25}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Printed-receipt rendering of an executed action. */
function ReceiptView({ action, locale }: { action: ActionView; locale: Locale }) {
  const t = useTranslations("assistant");
  const p = action.payload;
  const isSend = p.kind === "send_money";
  const isBuy = p.kind === "buy_stock";
  const [downloading, setDownloading] = useState(false);

  /** Fetch the WeasyPrint-rendered PDF; a renderer failure becomes a toast,
   * never a downloaded JSON error file. */
  async function downloadPdf() {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/assistant/actions/${action.id}/receipt?locale=${locale}`, {
        cache: "no-store", // never re-serve a previously cached error response
      });
      const type = res.headers.get("content-type") ?? "";
      if (!res.ok || !type.includes("application/pdf")) throw new Error("not a pdf");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `naqd-receipt-${action.id.slice(-8).toUpperCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t("pdfError"));
    } finally {
      setDownloading(false);
    }
  }
  const executed = action.executedAt ? new Date(action.executedAt) : new Date();
  const reference = action.id.slice(-8).toUpperCase();
  const amount = isSend ? p.amount : p.totalSar;
  const after = isSend
    ? (action.result?.newBalance ?? p.balanceBefore - p.amount)
    : (action.result?.newCash ?? (isBuy ? p.cashBefore - p.totalSar : p.cashBefore + p.totalSar));

  return (
    <div>
      {/* drop-shadow (not box-shadow) so the torn edge casts it too */}
      <div className="[filter:drop-shadow(0_1px_3px_rgb(0_0_0/0.08))]">
      <div className="rounded-t-2xl border border-b-0 border-border bg-surface px-5 pb-4 pt-4">
        {/* Brand + executed pill */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-soft text-primary-strong">
              <LogoMark className="h-3.5 w-3.5" aria-hidden />
            </span>
            <span className="truncate text-xs font-semibold text-foreground">
              {isSend ? t("receiptSend") : t("receiptOrder")}
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-positive-soft px-2 py-0.5 text-[11px] font-medium text-positive">
            <span className="h-3.5 w-3.5">
              <AnimatedCheck />
            </span>
            {t("statusExecuted")}
          </span>
        </div>

        {/* Hero amount */}
        <div className="mt-4 text-center">
          <CountUpMoney
            to={amount}
            locale={locale}
            duration={0.9}
            className="text-2xl font-semibold tracking-tight text-foreground"
          />
          <p className="mx-auto mt-1 max-w-full truncate text-xs text-muted-foreground">
            {isSend
              ? `${t("actionTo")} ${pick(p.beneficiaryName, locale)}${
                  pick(p.bank, locale) ? ` · ${pick(p.bank, locale)}` : ""
                }`
              : `${isBuy ? t("actionBuyTitle") : t("actionSellTitle")} · ${pick(p.name, locale)}`}
          </p>
        </div>

        <div className="my-4 border-t border-dashed border-border-strong" />

        {/* Details */}
        <div className="space-y-2">
          <ReceiptRow index={0} label={t("receiptDate")}>
            <span className="tnum">
              {formatDate(executed, locale)} · {formatTime(executed, locale)}
            </span>
          </ReceiptRow>
          <ReceiptRow index={1} label={t("receiptRef")}>
            <span dir="ltr" className="tnum tracking-wide">
              {reference}
            </span>
          </ReceiptRow>
          {isSend ? (
            <>
              <ReceiptRow index={2} label={t("actionBank")}>
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <span className="truncate">{pick(p.bank, locale)}</span>
                  <span dir="ltr" className="shrink-0 text-subtle-foreground tnum">
                    …{p.ibanLast4}
                  </span>
                </span>
              </ReceiptRow>
              {p.note && (
                <ReceiptRow index={3} label={t("actionNote")}>
                  <span className="truncate">{p.note}</span>
                </ReceiptRow>
              )}
              <ReceiptRow index={p.note ? 4 : 3} label={t("actionBalanceAfter")}>
                <Money value={after} locale={locale} className="text-xs" />
              </ReceiptRow>
            </>
          ) : (
            <>
              <ReceiptRow index={2} label={t("actionUnits")}>
                <span className="tnum">{formatNumber(p.units, locale)}</span>
              </ReceiptRow>
              <ReceiptRow index={3} label={t("actionPrice")}>
                <Money value={p.price} locale={locale} currency={p.currency} className="text-xs" />
              </ReceiptRow>
              <ReceiptRow index={4} label={t("actionCashAfter")}>
                <Money value={after} locale={locale} className="text-xs" />
              </ReceiptRow>
            </>
          )}
        </div>
      </div>
      <Sawtooth />
      </div>

      {/* Download as a real PDF (rendered server-side by WeasyPrint) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.3 }}
        className="mt-2 flex justify-end"
      >
        <button
          type="button"
          onClick={downloadPdf}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          {t("downloadPdf")}
        </button>
      </motion.div>
    </div>
  );
}
