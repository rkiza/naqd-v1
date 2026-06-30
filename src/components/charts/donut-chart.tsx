"use client";

import { useState, type ReactNode } from "react";
import { arcPath } from "./chart-utils";
import { cn } from "@/lib/utils";

export type DonutSlice = { id: string; label: string; value: number; color: string };

/**
 * Donut chart with an interactive center. Hovering a segment lifts it and
 * surfaces its label/value in the middle. Direction-agnostic by design.
 */
export function DonutChart({
  data,
  size = 200,
  thickness = 22,
  center,
  onActiveChange,
  className,
}: {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  center?: ReactNode;
  onActiveChange?: (id: string | null) => void;
  className?: string;
}) {
  const [active, setActive] = useState<string | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2;
  const rInner = size / 2 - thickness;

  // Start at top (−90°), go clockwise.
  let angle = -Math.PI / 2;
  const gap = 0.025;

  function setHover(id: string | null) {
    setActive(id);
    onActiveChange?.(id);
  }

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-0">
        {data.map((d, i) => {
          const frac = d.value / total;
          const start = angle + gap / 2;
          const end = angle + frac * Math.PI * 2 - gap / 2;
          angle += frac * Math.PI * 2;
          const isActive = active === d.id;
          const lift = isActive ? 1.5 : 0;
          return (
            <path
              key={d.id}
              d={arcPath(cx, cy, rOuter - 1, rInner, start, end)}
              fill={d.color}
              opacity={active === null || isActive ? 1 : 0.4}
              onPointerEnter={() => setHover(d.id)}
              onPointerLeave={() => setHover(null)}
              style={{
                transformOrigin: "center",
                transform: `scale(${1 + lift / size})`,
                transition: "opacity 0.2s, transform 0.2s",
                animation: `slice-in 0.6s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s both`,
                cursor: "pointer",
              }}
            />
          );
        })}
        <style>{`@keyframes slice-in{from{opacity:0}to{opacity:1}}`}</style>
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        {center}
      </div>
    </div>
  );
}
