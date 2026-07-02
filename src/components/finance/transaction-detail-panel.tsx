"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import type { Transaction } from "@/data/types";
import { categories } from "@/data/categories";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Money } from "@/components/ui/money";
import { SidePanel, PanelRow, PanelStatusPill } from "@/components/ui/side-panel";
import { pick } from "@/lib/localized";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_TONE = {
  completed: "positive",
  scheduled: "brand",
  pending: "neutral",
} as const;

/** Side overlay showing a transaction's full details. */
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

  const category = tx ? categories[tx.category] : null;

  return (
    <SidePanel
      open={open && !!tx && !!category}
      onClose={onClose}
      ariaLabel={tx ? pick(tx.merchant, locale) : undefined}
    >
      {tx && category && (
        <>
          <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8 text-center">
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
                tx.amount > 0 ? "text-positive" : "text-foreground",
              )}
            >
              <Money value={tx.amount} locale={locale} decimals={2} signed />
            </p>
            <PanelStatusPill tone={STATUS_TONE[tx.status]}>
              {t(
                tx.status === "completed"
                  ? "statusCompleted"
                  : tx.status === "scheduled"
                    ? "statusScheduled"
                    : "statusPending",
              )}
            </PanelStatusPill>
          </div>

          <dl className="space-y-1 border-t border-border px-6 py-4">
            <PanelRow label={t("date")}>
              {`${formatDate(tx.date, locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })} · ${formatTime(tx.date, locale)}`}
            </PanelRow>
            <PanelRow label={t("type")}>
              {t(
                tx.type === "income"
                  ? "typeIncome"
                  : tx.type === "expense"
                    ? "typeExpense"
                    : "typeTransfer",
              )}
            </PanelRow>
            <PanelRow label={t("method")}>
              {t(
                tx.method === "card"
                  ? "methodCard"
                  : tx.method === "applepay"
                    ? "methodApplepay"
                    : tx.method === "transfer"
                      ? "methodTransfer"
                      : "methodWallet",
              )}
            </PanelRow>
            {tx.note && <PanelRow label={t("note")}>{pick(tx.note, locale)}</PanelRow>}
            <PanelRow label={t("reference")}>
              <span className="font-mono text-xs" dir="ltr">
                {tx.id}
              </span>
            </PanelRow>
          </dl>
        </>
      )}
    </SidePanel>
  );
}
