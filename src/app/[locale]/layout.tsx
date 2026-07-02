import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing, localeDirection, isLocale, type Locale } from "@/i18n/routing";
import { geistSans, plexArabic } from "../fonts";
import { Providers } from "../providers";
import "../globals.css";

export const metadata: Metadata = {
  title: {
    default: "naqd — Smart money for Saudi Arabia",
    template: "%s · naqd",
  },
  description:
    "naqd is a premium Saudi fintech for spending, investing, and growing your money — with an AI assistant, in Arabic and English.",
  applicationName: "naqd",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  // Extend the app under the device safe areas (notch / status bar) so we can
  // paint them ourselves — see the safe-area padding on the sticky topbar.
  viewportFit: "cover",
  // Single default (light surface). The app theme is manual (next-themes class,
  // not prefers-color-scheme), so <ThemeColorMeta> keeps this in sync with the
  // resolved theme on the client — otherwise the safe area ignores dark mode.
  themeColor: "#ffffff",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = localeDirection[locale as Locale];

  return (
    <html
      lang={locale}
      dir={dir}
      suppressHydrationWarning
      className={`${geistSans.variable} ${plexArabic.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <Providers>
          <NextIntlClientProvider messages={messages}>
            {children}
          </NextIntlClientProvider>
        </Providers>
      </body>
    </html>
  );
}
