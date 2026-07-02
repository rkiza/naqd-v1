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
      offset={80}
      mobileOffset={16}
      gap={12}
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-2xl !border !border-border-strong !bg-surface !text-foreground !shadow-xl !px-4 !py-3.5",
          title: "!text-sm !font-semibold",
          description: "!text-sm !text-muted-foreground",
          success: "!border-primary/30 !bg-surface !text-foreground",
          error: "!border-negative/30 !bg-surface",
        },
      }}
      {...props}
    />,
    document.body,
  );
}
