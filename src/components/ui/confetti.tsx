"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";

const COLORS = ["#16a34a", "#22c55e", "#14b8a6", "#2f6df0", "#f59e0b", "#ec4899"];

type Piece = {
  drift: number;
  xEnd: number;
  rise: number;
  rotate: number;
  color: string;
  size: number;
  ratio: number;
  round: boolean;
  delay: number;
  duration: number;
};

/**
 * A one-shot confetti burst that overlays the whole page. Rendered through a
 * portal to document.body so it escapes any transformed/overflow-clipped
 * ancestor (e.g. a modal panel) and covers the full viewport above everything.
 * Pieces fan out from the top-center, pop up, then fall past the bottom under an
 * ease-in "gravity" curve. Decorative, non-interactive, and skipped under
 * reduced-motion. Regenerates on remount — re-key it to replay.
 */
export function Confetti({ count = 140, originY = 80 }: { count?: number; originY?: number }) {
  const reduce = useReducedMotion();
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    setDims({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  const pieces = useMemo<Piece[]>(() => {
    if (reduce || !dims) return [];
    const r = Math.random;
    return Array.from({ length: count }, () => {
      const xEnd = (r() - 0.5) * dims.w; // fan across the full viewport width
      return {
        xEnd,
        drift: xEnd * 0.45,
        rise: 40 + r() * 120,
        rotate: (r() - 0.5) * 900,
        color: COLORS[Math.floor(r() * COLORS.length)]!,
        size: 7 + r() * 7,
        ratio: 1.3 + r() * 0.7,
        round: r() > 0.65,
        delay: r() * 0.2,
        duration: 1.8 + r() * 0.9,
      };
    });
  }, [count, reduce, dims]);

  if (reduce || !dims) return null;

  const fall = dims.h + 60;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          className="absolute left-1/2 top-0 will-change-transform"
          style={{
            width: p.size,
            height: p.round ? p.size : p.size * p.ratio,
            backgroundColor: p.color,
            borderRadius: p.round ? 9999 : 2,
          }}
          initial={{ x: 0, y: originY, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, p.drift, p.xEnd],
            y: [originY, originY - p.rise, fall],
            rotate: [0, p.rotate * 0.4, p.rotate],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            times: [0, 0.2, 1],
            ease: ["easeOut", "easeIn"],
            opacity: {
              duration: p.duration,
              delay: p.delay,
              times: [0, 0.8, 1],
              ease: "easeIn",
            },
          }}
        />
      ))}
    </div>,
    document.body,
  );
}
