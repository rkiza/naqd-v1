"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Loader2, Plus, Wallet, PiggyBank, LineChart } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import type { Account } from "@/data/types";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Money } from "@/components/ui/money";
import { Confetti } from "@/components/ui/confetti";
import { RiyalGlyph } from "@/components/brand/riyal";
import { pick } from "@/lib/localized";
import { cn } from "@/lib/utils";

const PRESETS = [100, 500, 1000, 5000];
const icons = { current: Wallet, savings: PiggyBank, investment: LineChart };

type Phase = "form" | "processing" | "done";

export function TopUpDialog({
  open,
  onClose,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("wallet");
  const router = useRouter();

  const defaultAccount =
    accounts.find((a) => a.kind === "current")?.id ?? accounts[0]?.id ?? "";

  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState(defaultAccount);
  const [phase, setPhase] = useState<Phase>("form");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAmount("");
      setAccountId(defaultAccount);
      setPhase("form");
      setError(null);
    }
  }, [open, defaultAccount]);

  const numeric = Number(amount);
  const valid = Number.isFinite(numeric) && numeric > 0;
  const credited = accounts.find((a) => a.id === accountId);

  async function submit() {
    if (!valid || phase !== "form") return;
    setError(null);
    setPhase("processing");
    try {
      // Simulate a brief network / provider settlement delay.
      await new Promise((r) => setTimeout(r, 1200));
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numeric, accountId }),
      });
      if (!res.ok) throw new Error("failed");
      setPhase("done");
      // Pull the fresh, DB-backed finance context so balances update.
      router.refresh();
      // Hold long enough for the confetti to settle before closing.
      setTimeout(onClose, 2600);
    } catch {
      setError(t("topupError"));
      setPhase("form");
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title={t("addMoney")}>
      {phase === "done" ? (
        <div className="relative flex flex-col items-center gap-3 py-8 text-center">
          <Confetti />
          <motion.span
            className="grid h-16 w-16 place-items-center rounded-full bg-positive-soft text-positive"
            initial={{ scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.05 }}
          >
            <Check className="h-8 w-8" strokeWidth={2.5} />
          </motion.span>
          <p className="text-lg font-semibold text-foreground">{t("topupDone")}</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {t("topupDoneBody", { account: credited ? pick(credited.name, locale) : "" })}
          </p>
          <p className="text-2xl font-semibold text-foreground">
            <Money value={numeric} locale={locale} decimals={2} />
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="pe-8">
            <h2 className="text-base font-semibold text-foreground">{t("topupTitle")}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{t("topupSubtitle")}</p>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t("topupAmount")}
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring">
              <RiyalGlyph className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                inputMode="decimal"
                placeholder="0.00"
                dir="ltr"
                value={amount}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d.]/g, "");
                  // keep a single decimal point
                  const parts = v.split(".");
                  setAmount(parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : v);
                }}
                className="w-full bg-transparent text-2xl font-semibold text-foreground tnum outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(String(p))}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
                    Number(amount) === p
                      ? "border-primary bg-brand-soft text-primary-strong"
                      : "border-border text-foreground hover:bg-accent",
                  )}
                >
                  <Money value={p} locale={locale} decimals={0} />
                </button>
              ))}
            </div>
          </div>

          {/* Destination account */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              {t("topupTo")}
            </label>
            <div className="grid gap-2">
              {accounts.map((acc) => {
                const Icon = icons[acc.kind];
                const active = acc.id === accountId;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setAccountId(acc.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-start transition-colors",
                      active
                        ? "border-primary bg-brand-soft"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong">
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {pick(acc.name, locale)}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        <Money value={acc.balance} locale={locale} decimals={2} />
                      </span>
                    </span>
                    {active && <Check className="h-4 w-4 shrink-0 text-primary-strong" />}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-center text-sm font-medium text-negative">{error}</p>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!valid || phase === "processing"}
            onClick={submit}
          >
            {phase === "processing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("topupProcessing")}
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                {t("topupConfirm")}
              </>
            )}
          </Button>
        </div>
      )}
    </Dialog>
  );
}
