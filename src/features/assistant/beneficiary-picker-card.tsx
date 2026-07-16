"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronRight, UserRound } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Avatar } from "@/components/ui/avatar";
import { Money } from "@/components/ui/money";
import { pick, type Localized } from "@/lib/localized";
import { cn } from "@/lib/utils";

export type BeneficiaryPickerData = {
  /** SAR amount the user already gave, if any — echoed back on selection. */
  amount?: number | null;
  beneficiaries: Array<{
    extId: string;
    name: Localized;
    bank: Localized;
    ibanLast4: string;
    favorite: boolean;
  }>;
};

/**
 * Tappable saved-beneficiaries list the assistant shows when the user wants to
 * send money without naming a recipient. Picking one sends the choice back
 * into the chat as the user's next message.
 */
export function BeneficiaryPickerCard({
  data,
  disabled = false,
  onPick,
}: {
  data: BeneficiaryPickerData;
  disabled?: boolean;
  onPick: (name: string, amount?: number | null) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("assistant");
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong">
          <UserRound className="h-4.5 w-4.5" />
        </span>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
          {t("pickRecipientTitle")}
        </p>
        {data.amount ? (
          <Money
            value={data.amount}
            locale={locale}
            decimals={0}
            className="shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-primary-strong"
          />
        ) : null}
      </div>

      {/* Beneficiaries */}
      <div className="divide-y divide-border">
        {data.beneficiaries.map((b, i) => {
          const name = pick(b.name, locale);
          const isPicked = picked === b.extId;
          return (
            <motion.button
              key={b.extId}
              type="button"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.05, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              disabled={disabled || picked !== null}
              onClick={() => {
                setPicked(b.extId);
                onPick(name, data.amount);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-2.5 text-start transition-colors",
                picked === null && !disabled && "hover:bg-accent",
                picked !== null && !isPicked && "opacity-45",
              )}
            >
              <Avatar name={name} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">{name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {pick(b.bank, locale)}
                  <span dir="ltr" className="tnum"> · …{b.ibanLast4}</span>
                </span>
              </span>
              {isPicked ? (
                <Check className="h-4 w-4 shrink-0 text-positive" />
              ) : (
                <ChevronRight className="rtl-flip h-4 w-4 shrink-0 text-subtle-foreground" />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
