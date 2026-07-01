"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Company logo with a resilient source chain (Clearbit's free API was shut
 * down, so we no longer rely on it):
 *   1. Local override:  /logos/<TICKER>.svg  then  .png   (crisp, offline)
 *   2. DuckDuckGo icon API, then Google favicon API        (free, no auth)
 *   3. Branded ticker tile                                 (always works)
 *
 * Candidates are preloaded in order; the first that decodes wins, so there's
 * never a broken-image icon.
 */
export function StockLogo({
  domain,
  symbol,
  color,
  size = 40,
  className,
}: {
  domain: string;
  symbol: string;
  color: string;
  size?: number;
  className?: string;
}) {
  const safeSymbol = symbol.replace(/[^A-Za-z0-9]/g, "");
  const candidates = useMemo(
    () => [
      `/logos/${safeSymbol}.svg`,
      `/logos/${safeSymbol}.png`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    ],
    [safeSymbol, domain],
  );

  const [resolved, setResolved] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setResolved(null);
    let i = 0;
    const tryNext = () => {
      if (!active || i >= candidates.length) return;
      const url = candidates[i++];
      const img = new window.Image();
      img.onload = () => {
        if (!active) return;
        if (img.naturalWidth > 1) setResolved(url);
        else tryNext();
      };
      img.onerror = tryNext;
      img.src = url;
    };
    tryNext();
    return () => {
      active = false;
    };
  }, [candidates]);

  const initials = safeSymbol.slice(0, 4) || symbol.slice(0, 2);

  return (
    <span
      dir="ltr"
      style={{ width: size, height: size }}
      className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-xl", className)}
    >
      {/* Base: branded ticker tile (always present) */}
      <span
        style={{ backgroundColor: color }}
        className="absolute inset-0 grid place-items-center text-[0.65rem] font-bold text-white"
      >
        {initials}
      </span>

      {/* Overlay: resolved logo */}
      {resolved && (
        <span className="absolute inset-0 grid place-items-center bg-white p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resolved} alt="" className="h-full w-full object-contain" />
        </span>
      )}
    </span>
  );
}
