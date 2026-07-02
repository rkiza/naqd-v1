"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowLeftRight,
  ShieldCheck,
  TrendingUp,
  Lightbulb,
  Info,
  CheckCheck,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { useFinance } from "@/components/finance/finance-provider";
import type { Notification } from "@/data/types";
import { pick } from "@/lib/localized";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const typeIcon: Record<Notification["type"], LucideIcon> = {
  transaction: ArrowLeftRight,
  security: ShieldCheck,
  investment: TrendingUp,
  insight: Lightbulb,
  system: Info,
};
const typeTone: Record<Notification["type"], string> = {
  transaction: "var(--info)",
  security: "var(--negative)",
  investment: "var(--brand)",
  insight: "var(--warning)",
  system: "var(--muted-foreground)",
};

export function NotificationsScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("notifications");
  const { notifications } = useFinance();
  const [items, setItems] = useState(notifications);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unread = items.filter((n) => !n.read).length;
  const visible = filter === "unread" ? items.filter((n) => !n.read) : items;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: t("filterAll") },
            { value: "unread", label: t("filterUnread") },
          ]}
        />
        <button
          onClick={() => setItems((prev) => prev.map((n) => ({ ...n, read: true })))}
          disabled={unread === 0}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-40"
        >
          <CheckCheck className="h-4 w-4" />
          {t("markAllRead")}
        </button>
      </div>

      <p className="text-sm text-muted-foreground tnum">
        {unread > 0 ? t("unread", { count: unread }) : t("allRead")}
      </p>

      <Card>
        <div className="divide-y divide-border p-2">
          {visible.length === 0 && (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {t("empty")}
            </p>
          )}
          {visible.map((n) => {
            const Icon = typeIcon[n.type];
            return (
              <button
                key={n.id}
                onClick={() =>
                  setItems((prev) =>
                    prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
                  )
                }
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl p-3 text-start transition-colors hover:bg-surface-muted",
                  !n.read && "bg-brand-soft/40",
                )}
              >
                <span
                  className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${typeTone[n.type]} 14%, transparent)`,
                    color: typeTone[n.type],
                  }}
                >
                  <Icon className="h-[1.15rem] w-[1.15rem]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {pick(n.title, locale)}
                    </p>
                    <span className="shrink-0 text-xs text-subtle-foreground">
                      {formatRelativeTime(n.date, locale)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                    {pick(n.body, locale)}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
