"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { localeDirection, type Locale } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { Sidebar } from "./sidebar";
import { SidebarNav } from "./sidebar-nav";
import { Topbar } from "./topbar";
import { useWelcomeToast } from "@/hooks/use-welcome-toast";
import { PageTransition } from "./page-transition";

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const locale = useLocale() as Locale;
  const rtl = localeDirection[locale] === "rtl";

  useWelcomeToast();

  return (
    <div className="flex min-h-dvh">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1180px]">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 start-0 z-50 flex w-[18rem] flex-col gap-6 border-e border-border bg-background px-4 pb-5 pt-[calc(1.5rem_+_env(safe-area-inset-top))] lg:hidden"
              initial={{ x: rtl ? "100%" : "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: rtl ? "100%" : "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
            >
              <div className="flex items-center justify-between px-2">
                <Link href="/dashboard" onClick={() => setDrawerOpen(false)}>
                  <Logo />
                </Link>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-1">
                <SidebarNav onNavigate={() => setDrawerOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
