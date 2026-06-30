import { cn } from "@/lib/utils";

/** Apple Pay glyph + label. "Apple Pay" is a brand term — never localized. */
export function ApplePayButton({
  label,
  className,
  onClick,
}: {
  label: string;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      dir="ltr"
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-black px-6 text-[0.95rem] font-medium text-white transition-transform active:scale-[0.98] dark:bg-white dark:text-black",
        className,
      )}
    >
      <span className="whitespace-nowrap">{label}</span>
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
        <path d="M17.05 12.04c-.02-2.05 1.68-3.03 1.75-3.08-.95-1.39-2.43-1.58-2.96-1.6-1.26-.13-2.46.74-3.1.74-.64 0-1.62-.72-2.67-.7-1.37.02-2.64.8-3.35 2.03-1.43 2.48-.37 6.15 1.02 8.16.68.98 1.49 2.08 2.55 2.04 1.02-.04 1.41-.66 2.65-.66 1.23 0 1.58.66 2.66.64 1.1-.02 1.79-1 2.46-1.98.78-1.13 1.1-2.23 1.12-2.29-.02-.01-2.15-.83-2.17-3.27zM15.04 6.03c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.86 2.48.9.07 1.83-.46 2.39-1.14z" />
      </svg>
    </button>
  );
}
