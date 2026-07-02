"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/** Surface colors that match --surface in globals.css for each theme. */
const THEME_COLOR = { light: "#ffffff", dark: "#0e1213" } as const;

/**
 * Keeps the <meta name="theme-color"> in sync with the resolved app theme.
 * The theme is toggled via a class (next-themes, enableSystem=false), not the OS
 * `prefers-color-scheme`, so a static media-based meta never reacts to the
 * in-app switch — the mobile safe area / status bar would stay light in dark
 * mode. This updates the tag whenever the resolved theme changes.
 */
export function ThemeColorMeta() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const color = resolvedTheme === "dark" ? THEME_COLOR.dark : THEME_COLOR.light;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", color);
  }, [resolvedTheme]);

  return null;
}
