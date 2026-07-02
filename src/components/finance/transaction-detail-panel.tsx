"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { localeDirection, type Locale } from "@/i18n/routing";
import type { Transaction } from "@/data/types";
import { categories } from "@/data/categories";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Money } from "@/components/ui/money";
import { pick } from "@/lib/localized";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A reusable side overlay panel that slides in from the inline-end edge to show
 * a transaction's full details. Direction-aware (slides from the correct side
 * in RTL), closes on backdrop click / Escape, and animates open and close with
 * a spring via AnimatePresence.
 */
export function TransactionDetailPanel({
  tx,
  open,
  onClose,
}: {
  tx: Transaction | null;
  open: boolean;
  onClose: () => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("transactions");
  const dir = localeDirection[locale];
  const offscreen = dir === "rtl" ? "-100%" : "100%";

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const income = tx ? tx.amount > 0 : false;
  const category = tx ? categories[tx.category] : null;

  const methodLabel = tx
    ? {
        card: t("methodCard"),
        applepay: t("methodApplepay"),
        transfer: t("methodTransfer"),
        wallet: t("methodWallet"),
      }[tx.method]
    : "";

  const typeLabel = tx
    ? {
        income: t("typeIncome"),
        expense: t("typeExpense"),
        transfer: t("typeTransfer"),
      }[tx.type]
    : "";

  const statusLabel = tx
    ? {
        completed: t("statusCompleted"),
        pending: t("statusPending"),
        scheduled: t("statusScheduled"),
      }[tx.status]
    : "";

  return (
    <AnimatePresence>
      {open && tx && category && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={pick(tx.merchant, locale)}
            className="relative z-10 ms-auto flex h-full w-full max-w-sm flex-col overflow-y-auto border-border bg-card shadow-xl ltr:border-l rtl:border-r"
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute end-4 top-4 grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-10 text-center">
              <span
                className="grid h-16 w-16 place-items-center rounded-2xl"
                style={{
                  backgroundColor: `color-mix(in oklab, ${category.color} 16%, transparent)`,
                }}
              >
                <DynamicIcon name={category.icon} className="h-7 w-7" strokeWidth={2.1} />
              </span>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {pick(tx.merchant, locale)}
                </p>
                <p className="text-sm text-muted-foreground">{pick(category.name, locale)}</p>
              </div>
              <p
                className={cn(
                  "text-3xl font-semibold tracking-tight",
                  income ? "text-positive" : "text-foreground",
                )}
              >
                <Money value={tx.amount} locale={locale} decimals={2} signed />
              </p>
              <StatusPill status={tx.status} label={statusLabel} />
            </div>

            <dl className="space-y-1 border-t border-border px-6 py-4">
              <Row label={t("date")}>
                {`${formatDate(tx.date, locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })} · ${formatTime(tx.date, locale)}`}
              </Row>
              <Row label={t("type")}>{typeLabel}</Row>
              <Row label={t("method")}>{methodLabel}</Row>
              <Row label={t("category")}>{pick(category.name, locale)}</Row>
              {tx.note && <Row label={t("note")}>{pick(tx.note, locale)}</Row>}
              <Row label={t("reference")}>
                <span className="font-mono text-xs" dir="ltr">
                  {tx.id}
                </span>
              </Row>
            </dl>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="text-end text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

function StatusPill({ status, label }: { status: Transaction["status"]; label: string }) {
  const tone =
    status === "completed"
      ? "bg-positive-soft text-positive"
      : status === "scheduled"
        ? "bg-brand-soft text-primary-strong"
        : "bg-surface-muted text-muted-foreground";
  return (
    <span className={cn("rounded-full px-3 py-1 text-xs font-medium", tone)}>{label}</span>
  );
}
