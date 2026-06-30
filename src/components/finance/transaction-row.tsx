"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import type { Transaction } from "@/data/types";
import { categories } from "@/data/categories";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { pick } from "@/lib/localized";
import { formatSignedCurrency, formatTime, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function TransactionRow({
  tx,
  showDate = false,
  className,
}: {
  tx: Transaction;
  showDate?: boolean;
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("transactions");
  const category = categories[tx.category];
  const income = tx.amount > 0;

  const methodLabel = {
    card: t("methodCard"),
    applepay: t("methodApplepay"),
    transfer: t("methodTransfer"),
    wallet: t("methodWallet"),
  }[tx.method];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl px-2 py-2.5 transition-colors hover:bg-surface-muted",
        className,
      )}
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: `color-mix(in oklab, ${category.color} 14%, transparent)` }}
      >
        <DynamicIcon
          name={category.icon}
          className="h-[1.1rem] w-[1.1rem]"
          strokeWidth={2.1}
        />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">
          {pick(tx.merchant, locale)}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {showDate
            ? formatDate(tx.date, locale, { day: "numeric", month: "short" })
            : tx.note
              ? pick(tx.note, locale)
              : methodLabel}
        </p>
      </div>

      <div className="text-end">
        <p
          className={cn(
            "text-sm font-semibold tnum",
            income ? "text-positive" : "text-foreground",
          )}
          dir="ltr"
        >
          {formatSignedCurrency(tx.amount, locale)}
        </p>
        <p className="text-xs text-subtle-foreground tnum">
          {tx.status === "scheduled"
            ? t("statusScheduled")
            : formatTime(tx.date, locale)}
        </p>
      </div>
    </div>
  );
}
