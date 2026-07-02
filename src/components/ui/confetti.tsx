"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "motion/react";

const COLORS = ["#16a34a", "#22c55e", "#14b8a6", "#2f6df0", "#f59e0b", "#ec4899"];

type Piece = {
  drift: number;
  x: number;
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
 * A one-shot confetti burst rendered with motion. Pieces pop up from `originY`,
 * fan out, then fall past the bottom under an ease-in "gravity" curve. Purely
 * decorative and non-interactive; skipped entirely under reduced-motion.
 * Regenerates its randomized pieces on remount, so re-key it to replay.
 */
export function Confetti({
  count = 90,
  originY = 44,
  fall = 560,
}: {
  count?: number;
  originY?: number;
  fall?: number;
}) {
  const reduce = useReducedMotion();

  const pieces = useMemo<Piece[]>(() => {
    if (reduce) return [];
    const r = Math.random;
    return Array.from({ length: count }, () => ({
      drift: (r() - 0.5) * 140,
      x: (r() - 0.5) * 320,
      rise: 40 + r() * 130,
      rotate: (r() - 0.5) * 720,
      color: COLORS[Math.floor(r() * COLORS.length)]!,
      size: 6 + r() * 6,
      ratio: 1.3 + r() * 0.6,
      round: r() > 0.68,
      delay: r() * 0.12,
      duration: 1.5 + r() * 0.9,
    }));
  }, [count, reduce]);

  if (reduce) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-t-3xl sm:rounded-3xl"
      aria-hidden
    >
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
            x: [0, p.drift, p.x],
            y: [originY, originY - p.rise, fall],
            rotate: [0, p.rotate * 0.5, p.rotate],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            times: [0, 0.25, 1],
            ease: ["easeOut", "easeIn"],
            opacity: {
              duration: p.duration,
              delay: p.delay,
              times: [0, 0.75, 1],
              ease: "easeIn",
            },
          }}
        />
      ))}
    </div>
  );
}
