"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { MarketProvider } from "@/features/markets/store";

/**
 * Global client providers. Theme defaults to light; dark is fully wired and
 * toggleable. System preference is intentionally disabled so light stays the
 * deliberate default per the product brief.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="naqd-theme"
    >
      <MarketProvider>{children}</MarketProvider>
    </ThemeProvider>
  );
}
