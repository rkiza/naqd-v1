"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { usePathname } from "@/i18n/routing";

/**
 * Fades each page in on navigation. The motion.div is keyed by pathname so it
 * remounts per route and always animates to its visible resting state.
 *
 * We deliberately avoid `AnimatePresence mode="wait"` here: gating the incoming
 * page on the outgoing page's exit can stall when a route contains its own
 * nested AnimatePresence (e.g. the wallet screen's dialog / detail panel),
 * leaving the new page unmounted until a hard refresh.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      key={pathname}
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
