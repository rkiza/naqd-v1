import { LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

/** mada / network glyph rendered as a small wordmark. */
function NetworkMark({ network }: { network: string }) {
  return (
    <span className="text-sm font-bold uppercase tracking-wider text-white/90">
      {network}
    </span>
  );
}

/**
 * The naqd virtual card face. Deep, premium gradient with the brand mark, an
 * EMV chip, and number/holder details. Kept LTR internally so the card art
 * reads consistently across locales.
 */
export function CardVisual({
  holder,
  last4,
  expiry,
  network = "mada",
  label,
  frozen = false,
  showNumber = false,
  className,
}: {
  holder: string;
  last4: string;
  expiry: string;
  network?: string;
  label?: string;
  frozen?: boolean;
  showNumber?: boolean;
  className?: string;
}) {
  return (
    <div
      dir="ltr"
      className={cn(
        "relative aspect-[1.585] w-full overflow-hidden rounded-[1.4rem] p-6 text-white shadow-xl transition-all duration-500",
        "bg-[radial-gradient(120%_120%_at_0%_0%,#0d2b12_0%,#0a1f0d_38%,#06140a_100%)]",
        frozen && "saturate-50",
        className,
      )}
    >
      {/* Glow accents */}
      <div className="pointer-events-none absolute -end-10 -top-10 h-44 w-44 rounded-full bg-brand/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -start-6 h-44 w-44 rounded-full bg-brand/15 blur-3xl" />
      {/* Subtle sheen */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.06)_45%,transparent_60%)]" />

      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-brand">
            <LogoMark className="h-6 w-6" />
            <span className="text-base font-semibold text-white">naqd</span>
          </div>
          {label && (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[0.65rem] font-medium text-white/80 backdrop-blur">
              {label}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* EMV chip */}
          <div className="h-7 w-9 rounded-md bg-gradient-to-br from-[#e6c878] to-[#b8923c]">
            <div className="grid h-full w-full grid-cols-2 gap-px p-1 opacity-40">
              <span className="rounded-[1px] border border-black/30" />
              <span className="rounded-[1px] border border-black/30" />
              <span className="rounded-[1px] border border-black/30" />
              <span className="rounded-[1px] border border-black/30" />
            </div>
          </div>
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-white/70" fill="none">
            <path
              d="M8.5 8a5 5 0 0 1 0 8M5 5.5a8.5 8.5 0 0 1 0 13M12 10.5a2 2 0 0 1 0 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div>
          <p className="font-mono text-lg tracking-[0.18em] text-white/95 tnum">
            {showNumber ? "4471 8820 1043" : "••••  ••••  ••••"}{" "}
            <span className="tnum">{last4}</span>
          </p>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[0.6rem] uppercase tracking-wider text-white/50">
                {holder}
              </p>
            </div>
            <div className="flex items-end gap-4">
              <p className="font-mono text-sm text-white/85 tnum">{expiry}</p>
              <NetworkMark network={network} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
