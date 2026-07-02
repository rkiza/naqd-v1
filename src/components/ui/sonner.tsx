"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { theme = "light" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      offset={20}
      gap={12}
      toastOptions={{
        classNames: {
          toast:
            "group toast !rounded-2xl !border !border-border !bg-card !text-foreground !shadow-lg !px-4 !py-3.5",
          title: "!text-sm !font-semibold",
          description: "!text-sm !text-muted-foreground",
          success: "!border-positive/25 !bg-card",
          error: "!border-negative/25 !bg-card",
        },
      }}
      {...props}
    />
  );
}
