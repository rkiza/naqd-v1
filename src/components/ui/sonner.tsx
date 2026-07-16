"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { theme = "light" } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      offset={76}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 12px)", left: 16, right: 16 }}
      gap={10}
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-2xl !border !border-border !bg-surface/90 !text-foreground !shadow-lg !shadow-black/5 !backdrop-blur-xl !px-4 !py-3",
          title: "!text-sm !font-semibold",
          description: "!text-xs !text-muted-foreground",
          success: "!text-foreground [&_[data-icon]]:!text-positive",
          error: "!text-foreground [&_[data-icon]]:!text-negative",
        },
      }}
      {...props}
    />,
    document.body,
  );
}
