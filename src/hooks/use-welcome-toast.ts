"use client";

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { useFinance } from "@/components/finance/finance-provider";
import { pick } from "@/lib/localized";
import { consumeWelcomeToast } from "@/lib/auth/welcome-toast";
import { showWelcomeToast } from "@/lib/ui/welcome-toast";

/**
 * Shows the one-time post sign-in greeting. With no explicit message stored,
 * greets the user by first name ("Welcome back, Fahad"); an explicit message
 * (e.g. account verification success) is shown as-is.
 */
export function useWelcomeToast() {
  const t = useTranslations("auth");
  const locale = useLocale() as Locale;
  const { user } = useFinance();
  const firstName = pick(user.firstName, locale);

  useEffect(() => {
    const message = consumeWelcomeToast();
    if (message === false) return;

    const frame = requestAnimationFrame(() => {
      showWelcomeToast(
        message || (firstName ? t("welcomeBackName", { name: firstName }) : t("welcomeBack")),
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [t, firstName]);
}
