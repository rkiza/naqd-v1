"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { consumeWelcomeToast } from "@/lib/auth/welcome-toast";
import { showWelcomeToast } from "@/lib/ui/welcome-toast";

export function useWelcomeToast() {
  const t = useTranslations("auth");

  useEffect(() => {
    if (!consumeWelcomeToast()) return;

    const frame = requestAnimationFrame(() => {
      showWelcomeToast(t("welcomeBack"));
    });

    return () => cancelAnimationFrame(frame);
  }, [t]);
}
