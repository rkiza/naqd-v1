"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeSwitcher({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("common");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={t("toggleTheme")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface text-foreground transition-colors hover:bg-accent",
        className,
      )}
    >
      {/* Avoid hydration mismatch: render a neutral icon until mounted. */}
      {mounted ? (
        isDark ? (
          <Moon className="h-[1.15rem] w-[1.15rem]" />
        ) : (
          <Sun className="h-[1.15rem] w-[1.15rem]" />
        )
      ) : (
        <Sun className="h-[1.15rem] w-[1.15rem] opacity-0" />
      )}
    </button>
  );
}
