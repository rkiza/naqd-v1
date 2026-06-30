"use client";

import { cn } from "@/lib/utils";

/** Accessible toggle switch (logical-direction safe). */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  label,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50",
        checked ? "bg-primary" : "bg-border-strong",
        className,
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          // Use logical translate so the knob slides correctly in RTL.
          checked
            ? "translate-x-[1.375rem] rtl:-translate-x-[1.375rem]"
            : "translate-x-0.5 rtl:-translate-x-0.5",
        )}
      />
    </button>
  );
}
