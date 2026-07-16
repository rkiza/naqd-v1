"use client";

import { toast } from "sonner";
import { LogoMark } from "@/components/brand/logo";

/**
 * Post sign-in greeting: a calm glass card in the app's own design language
 * (brand tile + single line), instead of a stock success toast. Custom-rendered
 * so light/dark theming comes straight from the CSS tokens. Tap to dismiss.
 */
export function showWelcomeToast(title: string, subtitle?: string) {
  toast.custom(
    (id) => (
      <button
        type="button"
        onClick={() => toast.dismiss(id)}
        className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-border bg-surface/90 px-4 py-3 text-start shadow-lg shadow-black/5 backdrop-blur-xl"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong">
          <LogoMark className="h-4.5 w-4.5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
          {subtitle && (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span>
          )}
        </span>
      </button>
    ),
    { duration: 4000 },
  );
}
