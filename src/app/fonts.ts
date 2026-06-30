import { Geist, IBM_Plex_Sans_Arabic } from "next/font/google";

/** Latin / English — Geist (Vercel). Variable, Apple-clean. */
export const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-app-sans",
  display: "swap",
});

/** Arabic — IBM Plex Sans Arabic. Premium, humanist, pairs with Geist. */
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-app-arabic",
  display: "swap",
});
