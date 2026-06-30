"use client";

import { useLocale } from "next-intl";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Directional change pill. Positive is brand-green, negative is red. The arrow
 * direction is meaning-based (up/down), not layout-based, so it reads correctly
 * in both LTR and RTL without mirroring.
 */
export function Delta({
  value,
  className,
  withBackground = true,
  size = "sm",
}: {
  /** Percentage change, e.g. 4.2 or -1.8 */
  value: number;
  className?: string;
  withBackground?: boolean;
  size?: "sm" | "md";
}) {
  const locale = useLocale() as Locale;
  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      dir="ltr"
      className={cn(
        "inline-flex items-center gap-0.5 font-medium tnum",
        size === "sm" ? "text-xs" : "text-sm",
        withBackground && "rounded-full px-2 py-0.5",
        positive
          ? withBackground
            ? "bg-positive-soft text-positive"
            : "text-positive"
          : withBackground
            ? "bg-negative-soft text-negative"
            : "text-negative",
        className,
      )}
    >
      <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} strokeWidth={2.5} />
      {formatPercent(Math.abs(value), locale, { decimals: 2 })}
    </span>
  );
}
