"use client";

import { useLocale, useTranslations } from "next-intl";
import { Zap } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { Bill } from "@/data/types";
import { categories } from "@/data/categories";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { Money } from "@/components/ui/money";
import { Button } from "@/components/ui/button";
import { SidePanel, PanelRow, PanelStatusPill } from "@/components/ui/side-panel";
import { pick } from "@/lib/localized";
import { formatDate } from "@/lib/format";

const STATUS = {
  due: { tone: "warning", key: "due" },
  scheduled: { tone: "info", key: "scheduled" },
  paid: { tone: "positive", key: "paid" },
} as const;

/** Side overlay showing an upcoming bill's details, with a pay action. */
export function BillDetailPanel({
  bill,
  open,
  onClose,
  onPay,
}: {
  bill: Bill | null;
  open: boolean;
  onClose: () => void;
  onPay?: (id: string) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("payments");

  const category = bill ? categories[bill.category] : null;
  const status = bill ? STATUS[bill.status] : null;

  return (
    <SidePanel
      open={open && !!bill && !!category}
      onClose={onClose}
      ariaLabel={bill ? pick(bill.biller, locale) : undefined}
    >
      {bill && category && status && (
        <>
          <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-accent text-foreground">
              <DynamicIcon name={category.icon} className="h-7 w-7" strokeWidth={2.1} />
            </span>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {pick(bill.biller, locale)}
              </p>
              <p className="text-sm text-muted-foreground">{pick(category.name, locale)}</p>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              <Money value={bill.amount} locale={locale} decimals={2} />
            </p>
            <PanelStatusPill tone={status.tone}>{t(status.key)}</PanelStatusPill>
          </div>

          <dl className="space-y-1 border-t border-border px-6 py-4">
            <PanelRow label={t("category")}>{pick(category.name, locale)}</PanelRow>
            <PanelRow label={t("dueDate")}>
              {formatDate(bill.dueDate, locale, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </PanelRow>
            <PanelRow label={t("amount")}>
              <Money value={bill.amount} locale={locale} decimals={2} />
            </PanelRow>
            <PanelRow label={t("autopay")}>
              {bill.autopay ? (
                <span className="inline-flex items-center gap-1 text-primary-strong">
                  <Zap className="h-3.5 w-3.5" />
                  {t("on")}
                </span>
              ) : (
                t("off")
              )}
            </PanelRow>
          </dl>

          {bill.status === "due" && onPay && (
            <div className="mt-auto border-t border-border px-6 py-4">
              <Button className="w-full" size="lg" onClick={() => onPay(bill.id)}>
                {t("payNow")}
              </Button>
            </div>
          )}
        </>
      )}
    </SidePanel>
  );
}
