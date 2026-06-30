"use client";

import { useTranslations, useLocale } from "next-intl";
import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { Logo } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { SidebarNav } from "./sidebar-nav";
import { user } from "@/data/finance";
import { pick } from "@/lib/localized";

export function Sidebar() {
  const locale = useLocale() as Locale;
  const t = useTranslations("assistant");

  return (
    <aside className="sticky top-0 hidden h-dvh w-[17rem] shrink-0 flex-col gap-6 border-e border-border bg-background/80 px-4 pb-5 pt-6 lg:flex">
      <Link href="/dashboard" className="px-2">
        <Logo />
      </Link>

      <div className="flex-1 overflow-y-auto px-1">
        <SidebarNav />
      </div>

      <Link
        href="/assistant"
        className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-brand-soft to-surface p-4 transition-shadow hover:shadow-md"
      >
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-foreground">
            {t("title")}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {t("suggestion3")}
        </p>
      </Link>

      <Link
        href="/settings"
        className="flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-surface"
      >
        <Avatar name={pick(user.name, locale)} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {pick(user.name, locale)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {pick(user.tier, locale)}
          </p>
        </div>
      </Link>
    </aside>
  );
}
