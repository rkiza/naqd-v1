"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Image that only renders once it has actually loaded — otherwise it shows a
 * branded placeholder. Preloading via JS (instead of a plain <img onError>)
 * avoids the native broken-image icon when a mockup file isn't present yet, and
 * sidesteps the pre-hydration error event being missed.
 */
function MockupImage({ src, alt, dir }: { src: string; alt: string; dir?: "ltr" | "rtl" }) {
  const [status, setStatus] = useState<"loading" | "ok" | "fail">("loading");

  useEffect(() => {
    let active = true;
    const img = new window.Image();
    img.onload = () => active && setStatus("ok");
    img.onerror = () => active && setStatus("fail");
    img.src = src;
    return () => {
      active = false;
    };
  }, [src]);

  if (status === "ok") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        dir={dir}
        className="h-full w-full object-cover object-top"
      />
    );
  }

  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-soft via-surface to-surface-muted">
      <div className="flex flex-col items-center gap-1.5 text-subtle-foreground">
        <span className="text-base font-semibold text-primary-strong">naqd</span>
        <span className="text-xs">{alt}</span>
      </div>
    </div>
  );
}

/** macOS-style browser window wrapping a product screenshot. */
export function BrowserFrame({
  src,
  alt,
  url = "naqd.sa",
  className,
}: {
  src: string;
  alt: string;
  url?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface px-4 py-2.5">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span className="mx-auto flex items-center gap-1.5 rounded-md bg-surface-muted px-3 py-1 text-xs text-muted-foreground" dir="ltr">
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          {url}
        </span>
      </div>
      <div className="aspect-[16/10] w-full bg-surface-muted">
        <MockupImage src={src} alt={alt} />
      </div>
    </div>
  );
}

/** iPhone-style frame wrapping a mobile screenshot. */
export function PhoneFrame({
  src,
  alt,
  dir,
  className,
}: {
  src: string;
  alt: string;
  dir?: "ltr" | "rtl";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative w-[220px] rounded-[2.2rem] border-[6px] border-[#0c0d0f] bg-[#0c0d0f] shadow-2xl",
        className,
      )}
    >
      <div className="absolute left-1/2 top-2 z-10 h-4 w-24 -translate-x-1/2 rounded-full bg-[#0c0d0f]" />
      <div className="aspect-[9/19] w-full overflow-hidden rounded-[1.7rem] bg-surface">
        <MockupImage src={src} alt={alt} dir={dir} />
      </div>
    </div>
  );
}
