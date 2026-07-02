"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { consumeWelcomeToast } from "@/lib/auth/welcome-toast";

export function useWelcomeToast() {
  const t = useTranslations("auth");

  useEffect(() => {
    if (!consumeWelcomeToast()) return;
    toast.success(t("welcomeBack"));
  }, [t]);
}
