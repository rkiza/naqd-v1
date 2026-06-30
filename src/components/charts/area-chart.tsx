"use client";

import { useId, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { localeDirection, type Locale } from "@/i18n/routing";
import { useMeasure, scale, smoothPath, type Pt } from "./chart-utils";
import { cn } from "@/lib/utils";

export type AreaPoint = { t: string; v: number };

/**
 * Smooth area/line trend chart. Fully responsive, animated on mount, with a
 * hover crosshair + tooltip. In RTL the time axis mirrors so the latest point
 * sits on the left, matching reading direction; all values format per locale.
 */
export function AreaChart({
  data,
  height = 220,
  color = "var(--brand)",
  formatValue,
  formatLabel,
  className,
}: {
  data: AreaPoint[];
  height?: number;
  color?: string;
  formatValue: (v: number) => string;
  formatLabel?: (t: string) => string;
  className?: string;
}) {
  const locale = useLocale() as Locale;
  const rtl = localeDirection[locale] === "rtl";
  const { ref, width } = useMeasure<HTMLDivElement>();
  const gid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);

  const pad = { top: 14, right: 8, bottom: 8, left: 8 };

  const geom = useMemo(() => {
    if (width === 0 || data.length === 0) return null;
    const values = data.map((d) => d.v);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const yMin = min - span * 0.12;
    const yMax = max + span * 0.18;

    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;

    const pts: Pt[] = data.map((d, i) => {
      const frac = data.length === 1 ? 0.5 : i / (data.length - 1);
      const x = pad.left + (rtl ? 1 - frac : frac) * innerW;
      const y = pad.top + (1 - (d.v - yMin) / (yMax - yMin)) * innerH;
      return { x, y };
    });

    const line = smoothPath(pts);
    const baseY = height - pad.bottom;
    const first = pts[0];
    const last = pts[pts.length - 1];
    const area = `${line} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`;
    return { pts, line, area, baseY };
  }, [width, data, height, rtl, pad.left, pad.right, pad.top, pad.bottom]);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!geom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let nearest = 0;
    let best = Infinity;
    geom.pts.forEach((p, i) => {
      const dist = Math.abs(p.x - x);
      if (dist < best) {
        best = dist;
        nearest = i;
      }
    });
    setHover(nearest);
  }

  const active = hover != null && geom ? geom.pts[hover] : null;

  return (
    <div ref={ref} className={cn("relative w-full", className)} style={{ height }}>
      {geom && (
        <svg
          width={width}
          height={height}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={geom.area} fill={`url(#fill-${gid})`} className="animate-fade-in" />
          <path
            d={geom.line}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 2000,
              strokeDashoffset: 2000,
              animation: "draw 1.1s cubic-bezier(0.22,1,0.36,1) forwards",
            }}
          />

          {active && (
            <g>
              <line
                x1={active.x}
                y1={pad.top - 6}
                x2={active.x}
                y2={geom.baseY}
                stroke="var(--border-strong)"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
              <circle r={6.5} cx={active.x} cy={active.y} fill={color} opacity={0.18} />
              <circle
                r={4}
                cx={active.x}
                cy={active.y}
                fill="var(--surface)"
                stroke={color}
                strokeWidth={2.5}
              />
            </g>
          )}
          <style>{`@keyframes draw{to{stroke-dashoffset:0}}`}</style>
        </svg>
      )}

      {active && hover != null && (
        <div
          className="pointer-events-none absolute z-10 -translate-y-full rounded-xl border border-border bg-popover px-3 py-2 shadow-lg"
          style={{
            insetInlineStart: rtl ? undefined : active.x,
            insetInlineEnd: rtl ? width - active.x : undefined,
            top: active.y - 12,
            transform: `translate(${rtl ? "50%" : "-50%"}, -100%)`,
          }}
        >
          <div className="text-sm font-semibold tnum text-foreground">
            {formatValue(data[hover].v)}
          </div>
          {formatLabel && (
            <div className="text-xs text-muted-foreground">
              {formatLabel(data[hover].t)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
