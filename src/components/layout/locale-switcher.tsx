"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Languages, Check } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import { locales, localeLabels, type Locale } from "@/i18n/routing";
import {
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";

/**
 * Instant language switch. Replaces the current route under the new locale,
 * preserving the path and query — the whole tree re-renders with new messages
 * and the correct text direction.
 */
export function LocaleSwitcher({ compact = false }: { compact?: boolean }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- route params are passed through untyped pathnames
        { pathname, params },
        { locale: next },
      );
    });
  }

  return (
    <Dropdown>
      <DropdownTrigger
        aria-label={t("changeLanguage")}
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          isPending && "opacity-60",
        )}
      >
        <Languages className="h-4 w-4 text-muted-foreground" />
        {!compact && (
          <span className="tnum">{localeLabels[locale].native}</span>
        )}
      </DropdownTrigger>
      <DropdownContent>
        <DropdownLabel>{t("changeLanguage")}</DropdownLabel>
        {locales.map((l) => (
          <DropdownItem
            key={l}
            active={l === locale}
            onSelect={() => switchTo(l)}
            icon={
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold",
                  l === locale
                    ? "bg-brand-soft text-primary-strong"
                    : "bg-accent text-muted-foreground",
                )}
              >
                {l === "ar" ? "ع" : "En"}
              </span>
            }
          >
            <span className="flex flex-col">
              <span className="font-medium">{localeLabels[l].native}</span>
              <span className="text-xs text-muted-foreground">
                {l === "ar" ? "Arabic" : "English"}
              </span>
            </span>
            {l === locale && <Check className="h-4 w-4 text-primary" />}
          </DropdownItem>
        ))}
      </DropdownContent>
    </Dropdown>
  );
}
