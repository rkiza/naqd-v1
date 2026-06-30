"use client";

import { useTranslations } from "next-intl";
import { Send, Plus, TrendingUp, ReceiptText, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/routing";

export function QuickActions() {
  const t = useTranslations("dashboard");

  const actions: { icon: LucideIcon; label: string; href: string }[] = [
    { icon: Send, label: t("send"), href: "/payments" },
    { icon: Plus, label: t("topUp"), href: "/wallet" },
    { icon: TrendingUp, label: t("invest"), href: "/investment" },
    { icon: ReceiptText, label: t("payBill"), href: "/payments" },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((a) => (
        <Link
          key={a.label}
          href={a.href}
          className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4"
        >
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-primary-strong transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <a.icon className="h-5 w-5" />
          </span>
          <span className="text-xs font-medium text-foreground sm:text-sm">
            {a.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
