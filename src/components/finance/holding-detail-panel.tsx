"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import type { Holding } from "@/data/types";
import { Money } from "@/components/ui/money";
import { Delta } from "@/components/ui/trend";
import { SidePanel, PanelRow } from "@/components/ui/side-panel";
import { pick } from "@/lib/localized";
import { formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Side overlay showing an investment holding's details. */
export function HoldingDetailPanel({
  holding,
  open,
  onClose,
}: {
  holding: Holding | null;
  open: boolean;
  onClose: () => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("portfolio");

  const gain = holding ? holding.value - holding.cost : 0;
  const ret = holding && holding.cost > 0 ? (gain / holding.cost) * 100 : 0;

  return (
    <SidePanel
      open={open && !!holding}
      onClose={onClose}
      ariaLabel={holding ? pick(holding.name, locale) : undefined}
    >
      {holding && (
        <>
          <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8 text-center">
            <span
              className="grid h-16 w-16 place-items-center rounded-2xl text-sm font-bold text-white"
              style={{ backgroundColor: holding.color }}
              dir="ltr"
            >
              {holding.symbol.slice(0, 3)}
            </span>
            <div>
              <p className="text-lg font-semibold text-foreground">
                {pick(holding.name, locale)}
              </p>
              <p className="text-sm text-muted-foreground">
                {pick(holding.kind, locale)} · {pick(holding.market, locale)}
              </p>
            </div>
            <p className="text-3xl font-semibold tracking-tight text-foreground">
              <Money value={holding.value} locale={locale} decimals={2} />
            </p>
            <Delta value={ret} />
          </div>

          <dl className="space-y-1 border-t border-border px-6 py-4">
            <PanelRow label={t("marketValue")}>
              <Money value={holding.value} locale={locale} decimals={2} />
            </PanelRow>
            <PanelRow label={t("costBasis")}>
              <Money value={holding.cost} locale={locale} decimals={2} />
            </PanelRow>
            <PanelRow label={t("units")}>{formatNumber(holding.units, locale)}</PanelRow>
            <PanelRow label={t("totalReturn")}>
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  gain >= 0 ? "text-positive" : "text-negative",
                )}
                dir="ltr"
              >
                <Money value={gain} locale={locale} decimals={2} signed /> (
                {formatPercent(ret, locale, { signed: true })})
              </span>
            </PanelRow>
            <PanelRow label={t("dayChange")}>
              <Delta value={holding.dayChange} withBackground={false} />
            </PanelRow>
            <PanelRow label={t("market")}>{pick(holding.market, locale)}</PanelRow>
            <PanelRow label={t("type")}>{pick(holding.kind, locale)}</PanelRow>
          </dl>
        </>
      )}
    </SidePanel>
  );
}
