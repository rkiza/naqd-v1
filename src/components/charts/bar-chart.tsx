"use client";

import { useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { localeDirection, type Locale } from "@/i18n/routing";
import { useMeasure } from "./chart-utils";
import { cn } from "@/lib/utils";

export type BarGroup = { t: string; income: number; expense: number };

/**
 * Grouped income vs expense bars. Bar order and group order mirror in RTL.
 * Heights animate up on mount; hover reveals a per-month tooltip.
 */
export function CashflowBars({
  data,
  height = 240,
  formatValue,
  formatLabel,
  incomeColor = "var(--brand)",
  expenseColor = "var(--border-strong)",
  className,
}: {
  data: BarGroup[];
  height?: number;
  formatValue: (v: number) => React.ReactNode;
  formatLabel: (t: string) => string;
  incomeColor?: string;
  expenseColor?: string;
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const rtl = localeDirection[locale] === "rtl";
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const padTop = 16;
  const padBottom = 28;

  const geom = useMemo(() => {
    if (width === 0 || data.length === 0) return null;
    const ordered = rtl ? [...data].reverse() : data;
    const max = Math.max(...data.flatMap((d) => [d.income, d.expense])) || 1;
    const innerH = height - padTop - padBottom;
    const groupW = width / data.length;
    const barW = Math.min(14, groupW * 0.28);
    const gap = 5;

    const groups = ordered.map((d, i) => {
      const cx = i * groupW + groupW / 2;
      const incomeH = (d.income / max) * innerH;
      const expenseH = (d.expense / max) * innerH;
      return {
        original: rtl ? data.length - 1 - i : i,
        cx,
        incomeH,
        expenseH,
        incomeX: cx - barW - gap / 2,
        expenseX: cx + gap / 2,
      };
    });
    return { groups, barW, baseY: height - padBottom };
  }, [width, data, height, rtl]);

  return (
    <div ref={ref} className={cn("relative w-full", className)} style={{ height }}>
      {geom && (
        <svg width={width} height={height} className="overflow-visible">
          {geom.groups.map((g, i) => {
            const isHover = hover === g.original;
            return (
              <g
                key={i}
                onPointerEnter={() => setHover(g.original)}
                onPointerLeave={() => setHover(null)}
              >
                <rect
                  x={g.cx - geom.barW - 2.5}
                  y={padTop}
                  width={geom.barW * 2 + 5}
                  height={geom.baseY - padTop}
                  fill="transparent"
                />
                <rect
                  x={g.incomeX}
                  y={geom.baseY - g.incomeH}
                  width={geom.barW}
                  height={g.incomeH}
                  rx={geom.barW / 2.5}
                  fill={incomeColor}
                  opacity={isHover || hover === null ? 1 : 0.45}
                  style={{
                    transformOrigin: `center ${geom.baseY}px`,
                    animation: `grow 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.04}s both`,
                  }}
                />
                <rect
                  x={g.expenseX}
                  y={geom.baseY - g.expenseH}
                  width={geom.barW}
                  height={g.expenseH}
                  rx={geom.barW / 2.5}
                  fill={expenseColor}
                  opacity={isHover || hover === null ? 1 : 0.45}
                  style={{
                    transformOrigin: `center ${geom.baseY}px`,
                    animation: `grow 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.04 + 0.05}s both`,
                  }}
                />
                <text
                  x={g.cx}
                  y={height - 8}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px] tnum"
                >
                  {formatLabel(data[g.original].t)}
                </text>
              </g>
            );
          })}
          <style>{`@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}`}</style>
        </svg>
      )}

      {hover != null && geom && (
        <div
          className="pointer-events-none absolute top-0 z-10 rounded-xl border border-border bg-popover px-3 py-2 shadow-lg"
          style={{
            insetInlineStart: rtl
              ? undefined
              : geom.groups.find((g) => g.original === hover)!.cx,
            insetInlineEnd: rtl
              ? width - geom.groups.find((g) => g.original === hover)!.cx
              : undefined,
            transform: `translate(${rtl ? "50%" : "-50%"}, 0)`,
          }}
        >
          <div className="mb-1 text-xs font-medium text-muted-foreground">
            {formatLabel(data[hover].t)}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: incomeColor }} />
            <span className="tnum font-semibold text-foreground">
              {formatValue(data[hover].income)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: expenseColor }} />
            <span className="tnum font-semibold text-foreground">
              {formatValue(data[hover].expense)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
