"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import type { ReactNode } from "react";
import { MarketProvider } from "@/features/markets/store";
import { Toaster } from "@/components/ui/sonner";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
        storageKey="naqd-theme"
      >
        <MarketProvider>
          {children}
          <Toaster />
        </MarketProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
