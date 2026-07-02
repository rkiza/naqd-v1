"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import type { Locale } from "@/i18n/routing";
import { Money } from "./money";

/**
 * Renders a monetary value that smoothly counts up (or down) to `to` on mount
 * and whenever `to` changes. Formatting is delegated to <Money>. Under
 * reduced-motion it snaps straight to the target.
 */
export function CountUpMoney({
  from = 0,
  to,
  locale,
  duration = 1.1,
  decimals = 2,
  signed = false,
  className,
}: {
  from?: number;
  to: number;
  locale: Locale;
  duration?: number;
  decimals?: number;
  signed?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : from);

  useEffect(() => {
    if (reduce) {
      setValue(to);
      return;
    }
    const controls = animate(from, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [from, to, duration, reduce]);

  return (
    <Money
      value={value}
      locale={locale}
      decimals={decimals}
      signed={signed}
      className={className}
    />
  );
}
