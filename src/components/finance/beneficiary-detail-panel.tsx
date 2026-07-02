"use client";

import { useLocale, useTranslations } from "next-intl";
import { Send, Star } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import type { Beneficiary } from "@/data/types";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidePanel, PanelRow, PanelStatusPill } from "@/components/ui/side-panel";
import { pick } from "@/lib/localized";

/** Side overlay showing a beneficiary's details, with a quick send action. */
export function BeneficiaryDetailPanel({
  beneficiary,
  open,
  onClose,
  onSend,
}: {
  beneficiary: Beneficiary | null;
  open: boolean;
  onClose: () => void;
  onSend?: (id: string) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("payments");

  return (
    <SidePanel
      open={open && !!beneficiary}
      onClose={onClose}
      ariaLabel={beneficiary ? pick(beneficiary.name, locale) : undefined}
    >
      {beneficiary && (
        <>
          <div className="flex flex-col items-center gap-3 px-6 pb-6 pt-8 text-center">
            <Avatar name={pick(beneficiary.name, locale)} size="lg" />
            <div>
              <p className="text-lg font-semibold text-foreground">
                {pick(beneficiary.name, locale)}
              </p>
              <p className="text-sm text-muted-foreground">
                {pick(beneficiary.bank, locale)}
              </p>
            </div>
            {beneficiary.favorite && (
              <PanelStatusPill tone="warning">
                <Star className="h-3 w-3 fill-current" />
                {t("favorite")}
              </PanelStatusPill>
            )}
          </div>

          <dl className="space-y-1 border-t border-border px-6 py-4">
            <PanelRow label={t("bank")}>{pick(beneficiary.bank, locale)}</PanelRow>
            <PanelRow label={t("iban")}>
              <span className="font-mono text-xs tnum" dir="ltr">
                {beneficiary.iban}
              </span>
            </PanelRow>
          </dl>

          {onSend && (
            <div className="mt-auto border-t border-border px-6 py-4">
              <Button
                className="w-full"
                size="lg"
                onClick={() => onSend(beneficiary.id)}
              >
                <Send className="h-4 w-4 rtl-flip" />
                {t("sendMoney")}
              </Button>
            </div>
          )}
        </>
      )}
    </SidePanel>
  );
}
