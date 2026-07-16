"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp, Check } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Avatar } from "@/components/ui/avatar";
import { Money } from "@/components/ui/money";
import { RiyalGlyph } from "@/components/brand/riyal";
import { pick, type Localized } from "@/lib/localized";
import { cn } from "@/lib/utils";

const PRESETS = [100, 500, 1000, 5000];
const MAX_SAR = 1_000_000; // matches the server-side demo cap

export type AmountCardData = {
  beneficiary: {
    extId: string;
    name: Localized;
    bank: Localized;
    ibanLast4: string;
  };
};

/**
 * Amount-entry card the assistant shows when the transfer recipient is known
 * but no amount was given: quick preset chips + a free input. Submitting sends
 * the amount back into the chat, which produces the usual confirmation card.
 */
export function AmountCard({
  data,
  disabled = false,
  onSubmit,
}: {
  data: AmountCardData;
  disabled?: boolean;
  onSubmit: (amount: number, name: string) => void;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("assistant");
  const [value, setValue] = useState("");
  const [done, setDone] = useState<number | null>(null);

  const name = pick(data.beneficiary.name, locale);
  const amount = Number(value);
  const valid = Number.isFinite(amount) && amount > 0 && amount <= MAX_SAR;
  const locked = done !== null || disabled;

  function submit(v: number) {
    if (done !== null || disabled || !(v > 0 && v <= MAX_SAR)) return;
    setDone(v);
    onSubmit(v, name);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-xs"
    >
      {/* Recipient header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Avatar name={name} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {pick(data.beneficiary.bank, locale)}
            <span dir="ltr" className="tnum"> · …{data.beneficiary.ibanLast4}</span>
          </p>
        </div>
        {done !== null && <Check className="h-4 w-4 shrink-0 text-positive" />}
      </div>

      <div className={cn("space-y-3 px-4 py-3.5", done !== null && "opacity-60")}>
        <p className="text-xs font-medium text-muted-foreground">{t("amountTitle")}</p>

        {/* Amount input + send */}
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) submit(amount);
          }}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
            <RiyalGlyph className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              inputMode="decimal"
              placeholder="0.00"
              dir="ltr"
              value={done !== null ? String(done) : value}
              disabled={locked}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d.]/g, "");
                const parts = v.split(".");
                setValue(parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : v);
              }}
              className="w-full min-w-0 bg-transparent text-lg font-semibold text-foreground tnum outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            type="submit"
            disabled={!valid || locked}
            aria-label={t("send")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:bg-primary-strong disabled:opacity-40"
          >
            <ArrowUp className="h-4.5 w-4.5" />
          </button>
        </form>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p, i) => (
            <motion.button
              key={p}
              type="button"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 + i * 0.05, duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              disabled={locked}
              onClick={() => submit(p)}
              className={cn(
                "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
                done === p
                  ? "border-primary bg-brand-soft text-primary-strong"
                  : "border-border text-foreground",
                !locked && "hover:border-primary hover:bg-brand-soft",
              )}
            >
              <Money value={p} locale={locale} decimals={0} />
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
