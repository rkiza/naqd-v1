"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { navGroups } from "@/config/navigation";
import { notifications } from "@/data/content";
import { cn } from "@/lib/utils";

const unreadCount = notifications.filter((n) => !n.read).length;

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tGroups = useTranslations("navGroups");

  return (
    <nav className="flex flex-col gap-6">
      {navGroups.map((group) => (
        <div key={group.key}>
          <p className="mb-2 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-subtle-foreground">
            {tGroups(group.key)}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-surface text-foreground shadow-xs ring-1 ring-border"
                        : "text-muted-foreground hover:bg-surface/60 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[1.15rem] w-[1.15rem] shrink-0 transition-colors",
                        active
                          ? "text-primary"
                          : "text-subtle-foreground group-hover:text-foreground",
                      )}
                      strokeWidth={active ? 2.4 : 2}
                    />
                    <span className="flex-1">{tNav(item.key)}</span>
                    {item.badge === "ai" && (
                      <span className="rounded-full bg-brand-soft px-1.5 py-0.5 text-[0.625rem] font-semibold text-primary-strong">
                        AI
                      </span>
                    )}
                    {item.href === "/notifications" && unreadCount > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.625rem] font-bold text-primary-foreground tnum">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
