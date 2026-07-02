"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * A checkmark that draws itself in — the ring sweeps first, then the tick.
 * Inherits `currentColor`. Sized by its container.
 */
export function AnimatedCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 52 52" fill="none" className={cn("h-full w-full", className)} aria-hidden>
      <motion.circle
        cx="26"
        cy="26"
        r="24"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0.35 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
      <motion.path
        d="M16 26.5l6.5 6.5L37 19"
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.35, ease: "easeOut", delay: 0.3 }}
      />
    </svg>
  );
}
