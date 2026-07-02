"use client";

import { useTranslations, useLocale } from "next-intl";
import { Menu, Search, Bell, User, LogOut, ChevronDown } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import type { Locale } from "@/i18n/routing";
import { navItems } from "@/config/navigation";
import { Avatar } from "@/components/ui/avatar";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { useFinance } from "@/components/finance/finance-provider";
import { pick } from "@/lib/localized";

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const tNav = useTranslations("nav");
  const tTop = useTranslations("topbar");
  const tCommon = useTranslations("common");
  const { user, notifications } = useFinance();

  const unread = notifications.filter((n) => !n.read).length;

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  const active = navItems.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );

  return (
    <header className="glass sticky top-0 z-30 border-b border-border pt-[env(safe-area-inset-top)]">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label={tCommon("more")}
        className="grid h-10 w-10 place-items-center rounded-xl text-foreground hover:bg-accent lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        {active ? tNav(active.key) : "naqd"}
      </h1>

      <div className="ms-auto flex items-center gap-2">
        <label className="relative hidden md:block">
          <Search className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder={tTop("searchPlaceholder")}
            aria-label={tCommon("search")}
            className="h-10 w-44 rounded-xl border border-border bg-surface ps-9 pe-3 text-sm text-foreground placeholder:text-subtle-foreground focus-visible:w-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-[width]"
          />
        </label>

        <LocaleSwitcher compact />
        <ThemeSwitcher />

        <Link
          href="/notifications"
          aria-label={tTop("notifications")}
          className="relative grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface text-foreground hover:bg-accent"
        >
          <Bell className="h-[1.15rem] w-[1.15rem]" />
          {unread > 0 && (
            <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-primary ring-2 ring-surface" />
          )}
        </Link>

        <Dropdown>
          <DropdownTrigger className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface ps-1 pe-2 hover:bg-accent">
            <Avatar name={pick(user.name, locale)} size="sm" />
            <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
          </DropdownTrigger>
          <DropdownContent>
            <div className="flex items-center gap-3 rounded-xl px-3 py-2">
              <Avatar name={pick(user.name, locale)} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {pick(user.name, locale)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
            <DropdownSeparator />
            <DropdownItem href="/settings" icon={<User className="h-4 w-4" />}>
              {tTop("viewProfile")}
            </DropdownItem>
            <DropdownItem icon={<LogOut className="h-4 w-4" />} onSelect={handleSignOut}>
              {tTop("signOut")}
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
      </div>
    </header>
  );
}
