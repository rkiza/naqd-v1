"use client";

import { useId } from "react";
import { useLocale } from "next-intl";
import { localeDirection, type Locale } from "@/i18n/routing";
import { smoothPath, r, type Pt } from "./chart-utils";

/** Tiny inline trend line for stat cards. Mirrors horizontally in RTL. */
export function Sparkline({
  data,
  width = 96,
  height = 32,
  color = "var(--brand)",
  filled = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
}) {
  const locale = useLocale() as Locale;
  const rtl = localeDirection[locale] === "rtl";
  const gid = useId().replace(/:/g, "");
  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const pad = 2;
  const pts: Pt[] = data.map((v, i) => {
    const frac = data.length === 1 ? 0.5 : i / (data.length - 1);
    const x = pad + (rtl ? 1 - frac : frac) * (width - pad * 2);
    const y =
      pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2);
    return { x, y };
  });
  const line = smoothPath(pts);
  const area = `${line} L ${r(pts[pts.length - 1].x)} ${height} L ${r(pts[0].x)} ${height} Z`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {filled && (
        <>
          <defs>
            <linearGradient id={`spark-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#spark-${gid})`} />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
