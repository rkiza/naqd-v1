import type { Locale } from "@/i18n/routing";
import { RiyalGlyph } from "@/components/brand/riyal";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Renders a monetary amount. For SAR it shows the official Saudi Riyal symbol
 * (SVG glyph) followed by the locale-formatted number; for any other currency
 * it uses the standard Intl currency string. The number is always LTR with
 * tabular figures.
 */
export function Money({
  value,
  locale,
  currency = "SAR",
  compact = false,
  decimals,
  signed = false,
  className,
  glyphClassName,
}: {
  value: number;
  locale: Locale;
  currency?: string;
  compact?: boolean;
  decimals?: number;
  signed?: boolean;
  className?: string;
  glyphClassName?: string;
}) {
  if (currency !== "SAR") {
    return (
      <span dir="ltr" className={cn("tnum", className)}>
        {formatCurrency(value, locale, {
          currency,
          compact,
          decimals,
          ...(signed ? {} : {}),
        })}
      </span>
    );
  }

  const number = formatNumber(value, locale, {
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: decimals ?? (compact ? 0 : 2),
    maximumFractionDigits: decimals ?? (compact ? 1 : 2),
    signDisplay: signed ? "exceptZero" : "auto",
  });

  return (
    <span dir="ltr" className={cn("inline-flex items-center gap-[0.18em] tnum", className)}>
      <RiyalGlyph className={glyphClassName} />
      {number}
    </span>
  );
}
