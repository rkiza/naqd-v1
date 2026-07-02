"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useLocale } from "next-intl";
import { localeDirection, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/**
 * A reusable detail overlay that slides in from the inline-end edge. Direction
 * aware (correct side in RTL), closes on backdrop click / Escape, springs open
 * and closed via AnimatePresence, and on mobile is a full-width sheet that pads
 * the device safe areas (notch / home indicator).
 */
export function SidePanel({
  open,
  onClose,
  ariaLabel,
  children,
}: {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  children: ReactNode;
}) {
  const locale = useLocale() as Locale;
  const offscreen = localeDirection[locale] === "rtl" ? "-100%" : "100%";

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <motion.div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className="relative z-10 ms-auto flex h-full w-full max-w-sm flex-col overflow-y-auto overscroll-contain border-border bg-card shadow-xl ltr:border-l rtl:border-r"
            initial={{ x: offscreen }}
            animate={{ x: 0 }}
            exit={{ x: offscreen }}
            transition={{ type: "spring", stiffness: 360, damping: 38 }}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute end-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex min-h-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
              {children}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

/** A label / value row for the detail list inside a <SidePanel>. */
export function PanelRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-end text-sm font-medium text-foreground">{children}</dd>
    </div>
  );
}

const PILL_TONES = {
  positive: "bg-positive-soft text-positive",
  brand: "bg-brand-soft text-primary-strong",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  neutral: "bg-surface-muted text-muted-foreground",
} as const;

/** A status pill for the panel header. */
export function PanelStatusPill({
  tone,
  children,
}: {
  tone: keyof typeof PILL_TONES;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
        PILL_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
