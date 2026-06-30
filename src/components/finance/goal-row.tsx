"use client";

import { useLocale } from "next-intl";
import type { Locale } from "@/i18n/routing";
import type { Goal } from "@/data/types";
import { DynamicIcon } from "@/components/ui/dynamic-icon";
import { pick } from "@/lib/localized";
import { formatCurrency, formatPercent } from "@/lib/format";

export function GoalRow({ goal }: { goal: Goal }) {
  const locale = useLocale() as Locale;
  const pct = Math.min(100, (goal.saved / goal.target) * 100);

  return (
    <div>
      <div className="flex items-center gap-3">
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
          style={{ backgroundColor: `color-mix(in oklab, ${goal.color} 15%, transparent)`, color: goal.color }}
        >
          <DynamicIcon name={goal.icon} className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {pick(goal.name, locale)}
          </p>
          <p className="text-xs text-muted-foreground tnum">
            {formatCurrency(goal.saved, locale, { decimals: 0 })} / {formatCurrency(goal.target, locale, { decimals: 0, compact: true })}
          </p>
        </div>
        <span className="text-sm font-semibold text-foreground tnum">
          {formatPercent(pct, locale, { decimals: 0 })}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: goal.color }}
        />
      </div>
    </div>
  );
}
