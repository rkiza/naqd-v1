import { cn } from "@/lib/utils";

/** Initials avatar with a deterministic brand-tinted background. */
export function Avatar({
  name,
  src,
  className,
  size = "md",
}: {
  name: string;
  src?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");

  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-soft font-semibold text-primary-strong select-none",
        sizes[size],
        className,
      )}
      aria-hidden={!name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span dir="ltr">{initials}</span>
      )}
    </span>
  );
}
