"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Company logo resolved from the brand domain via Clearbit's logo API. A
 * colored ticker tile is always rendered as the base, and the real logo is
 * swapped in only once it successfully loads (with a timeout) — so the UI is
 * never blank, online or offline.
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
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");

  useEffect(() => {
    const timer = setTimeout(
      () => setState((s) => (s === "loading" ? "failed" : s)),
      3000,
    );
    return () => clearTimeout(timer);
  }, []);

  const initials =
    symbol.replace(/[^A-Za-z0-9]/g, "").slice(0, 4) || symbol.slice(0, 2);

  return (
    <span
      dir="ltr"
      style={{ width: size, height: size }}
      className={cn("relative grid shrink-0 place-items-center overflow-hidden rounded-xl", className)}
    >
      {/* Base: colored ticker tile (always present) */}
      <span
        style={{ backgroundColor: color }}
        className="absolute inset-0 grid place-items-center text-[0.65rem] font-bold text-white"
      >
        {initials}
      </span>

      {/* Overlay: real logo once loaded */}
      {state !== "failed" && (
        <span
          className={cn(
            "absolute inset-0 grid place-items-center bg-white p-1.5 transition-opacity duration-300",
            state === "loaded" ? "opacity-100" : "opacity-0",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://logo.clearbit.com/${domain}?size=80`}
            alt=""
            onLoad={() => setState("loaded")}
            onError={() => setState("failed")}
            className="h-full w-full object-contain"
          />
        </span>
      )}
    </span>
  );
}
