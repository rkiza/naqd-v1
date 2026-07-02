"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FinanceContext } from "@/server/finance/get-finance-context";

const FinanceContext = createContext<FinanceContext | null>(null);

export function FinanceProvider({
  value,
  children,
}: {
  value: FinanceContext;
  children: ReactNode;
}) {
  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used within FinanceProvider");
  return ctx;
}
