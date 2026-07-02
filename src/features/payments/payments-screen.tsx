"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Send, Plus, Star, Zap, Check } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import type { Locale } from "@/i18n/routing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { useFinance } from "@/components/finance/finance-provider";
import { categories } from "@/data/categories";
import { pick } from "@/lib/localized";
import { formatDate } from "@/lib/format";
import { Money } from "@/components/ui/money";
import { RiyalGlyph } from "@/components/brand/riyal";
import { cn } from "@/lib/utils";

const billTone = { due: "warning", scheduled: "info", paid: "positive" } as const;

export function PaymentsScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("payments");
  const tc = useTranslations("common");
  const { beneficiaries, bills } = useFinance();
  const [amount, setAmount] = useState("500");
  const [selected, setSelected] = useState(beneficiaries[0]?.id ?? "");
  const [sent, setSent] = useState(false);

  const recipient = beneficiaries.find((b) => b.id === selected);

  const numericAmount = Number(amount) || 0;
  const billsTotal = bills
    .filter((b) => b.status !== "paid")
    .reduce((s, b) => s + b.amount, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Send money */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("sendMoney")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Amount */}
            <div className="rounded-2xl bg-surface-muted p-5 text-center">
              <p className="text-xs font-medium text-muted-foreground">{t("amount")}</p>
              <div className="mt-1 flex items-center justify-center gap-1" dir="ltr">
                <RiyalGlyph className="h-[1.4rem] w-[1.4rem] text-muted-foreground" />
                <input
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  className="w-40 bg-transparent text-center text-4xl font-semibold tracking-tight text-foreground tnum focus:outline-none"
                  aria-label={t("amount")}
                />
              </div>
            </div>

            {/* Recipient */}
            <div>
              <p className="mb-2 text-sm font-medium text-foreground">{t("selectRecipient")}</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {beneficiaries.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setSelected(b.id)}
                    className={cn(
                      "flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-colors",
                      selected === b.id
                        ? "border-primary bg-brand-soft"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    <Avatar name={pick(b.name, locale)} size="sm" />
                    <span className="line-clamp-1 text-[0.7rem] font-medium text-foreground">
                      {pick(b.name, locale).split(" ")[0]}
                    </span>
                  </button>
                ))}
                <button className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-dashed border-border p-2.5 text-muted-foreground hover:bg-accent">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-accent">
                    <Plus className="h-4 w-4" />
                  </span>
                  <span className="text-[0.7rem] font-medium">{t("addBeneficiary")}</span>
                </button>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={numericAmount <= 0}
              onClick={() => setSent(true)}
            >
              <Send className="h-4 w-4 rtl-flip" />
              <span className="inline-flex items-center gap-1.5">
                {t("send", { amount: "" }).trim()}
                <Money value={numericAmount} locale={locale} decimals={0} />
              </span>
            </Button>
          </CardContent>
        </Card>

        {/* Beneficiaries */}
        <Card>
          <CardHeader>
            <CardTitle>{t("beneficiaries")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {beneficiaries.map((b) => (
              <div key={b.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-surface-muted">
                <Avatar name={pick(b.name, locale)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {pick(b.name, locale)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {pick(b.bank, locale)} · <span className="tnum" dir="ltr">{b.iban}</span>
                  </p>
                </div>
                {b.favorite && <Star className="h-4 w-4 fill-warning text-warning" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Bills */}
      <Card className="self-start">
        <CardHeader>
          <div>
            <CardTitle>{t("upcomingBills")}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("billsDueTotal")}:{" "}
              <span className="font-medium text-foreground tnum">
                <Money value={billsTotal} locale={locale} decimals={0} />
              </span>
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="flex items-center gap-3 rounded-2xl border border-border p-3"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-foreground">
                <DynamicIcon name={categories[bill.category].icon} className="h-[1.1rem] w-[1.1rem]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {pick(bill.biller, locale)}
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("dueOn", {
                      date: formatDate(bill.dueDate, locale, { day: "numeric", month: "short" }),
                    })}
                  </span>
                  {bill.autopay && (
                    <Badge tone="brand" className="gap-0.5 text-[0.625rem]">
                      <Zap className="h-2.5 w-2.5" />
                      {t("autopay")}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  <Money value={bill.amount} locale={locale} decimals={0} />
                </span>
                {bill.status === "due" ? (
                  <Button size="sm" variant="primary" className="h-7 px-3 text-xs">
                    {t("payNow")}
                  </Button>
                ) : (
                  <Badge tone={billTone[bill.status]}>
                    {bill.status === "scheduled" ? t("scheduled") : t("paid")}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Success confirmation */}
      <Dialog open={sent} onClose={() => setSent(false)} title={t("sendMoney")}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-positive-soft text-positive">
            <Check className="h-8 w-8" strokeWidth={2.5} />
          </span>
          <p className="text-lg font-semibold text-foreground">
            <Money value={numericAmount} locale={locale} decimals={2} />
          </p>
          <p className="max-w-xs text-sm text-muted-foreground">
            {t("send", { amount: "" }).trim()} · {recipient ? pick(recipient.name, locale) : ""}
          </p>
          <Button className="mt-2 w-full" onClick={() => setSent(false)}>
            {tc("done")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
