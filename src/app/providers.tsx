"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

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
      {children}
    </ThemeProvider>
  );
}
