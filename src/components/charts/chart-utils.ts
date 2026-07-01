"use client";

import { useEffect, useRef, useState } from "react";

/** Measure an element's width, reactively (for responsive SVG viewBoxes). */
export function useMeasure<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(w);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

export type Pt = { x: number; y: number };

/**
 * Round to 2 decimals. Chart geometry is derived from Math.sin/Math.cos, which
 * can differ in the last ULP between the Node (V8) server and the browser
 * engine — rounding keeps the serialized SVG identical and avoids hydration
 * mismatches.
 */
export function r(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Linear scale helper. */
export function scale(
  value: number,
  domainMin: number,
  domainMax: number,
  rangeMin: number,
  rangeMax: number,
) {
  if (domainMax === domainMin) return (rangeMin + rangeMax) / 2;
  const t = (value - domainMin) / (domainMax - domainMin);
  return rangeMin + t * (rangeMax - rangeMin);
}

/**
 * Smooth a polyline into a bezier path using Catmull-Rom → cubic conversion.
 * Produces the soft, premium curve used across naqd's trend charts.
 */
export function smoothPath(points: Pt[], tension = 0.2): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${r(points[0].x)} ${r(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * (1 + tension);
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * (1 + tension);
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * (1 + tension);
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * (1 + tension);

    d += ` C ${r(cp1x)} ${r(cp1y)}, ${r(cp2x)} ${r(cp2y)}, ${r(p2.x)} ${r(p2.y)}`;
  }
  return d;
}

/** Build an SVG arc path for a donut/pie segment. */
export function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number,
): string {
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const x0 = cx + rOuter * Math.cos(startAngle);
  const y0 = cy + rOuter * Math.sin(startAngle);
  const x1 = cx + rOuter * Math.cos(endAngle);
  const y1 = cy + rOuter * Math.sin(endAngle);
  const x2 = cx + rInner * Math.cos(endAngle);
  const y2 = cy + rInner * Math.sin(endAngle);
  const x3 = cx + rInner * Math.cos(startAngle);
  const y3 = cy + rInner * Math.sin(startAngle);

  return [
    `M ${r(x0)} ${r(y0)}`,
    `A ${r(rOuter)} ${r(rOuter)} 0 ${large} 1 ${r(x1)} ${r(y1)}`,
    `L ${r(x2)} ${r(y2)}`,
    `A ${r(rInner)} ${r(rInner)} 0 ${large} 0 ${r(x3)} ${r(y3)}`,
    "Z",
  ].join(" ");
}
