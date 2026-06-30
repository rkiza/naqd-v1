import type { Metadata } from "next";
import { setRequestLocale, getTranslations, getLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { NetWorthCard } from "@/features/dashboard/net-worth-card";
import { QuickActions } from "@/features/dashboard/quick-actions";
import { MonthStats } from "@/features/dashboard/month-stats";
import { SpendingBreakdown } from "@/features/dashboard/spending-breakdown";
import { RecentActivity } from "@/features/dashboard/recent-activity";
import { AccountsCard } from "@/features/dashboard/accounts-card";
import { GoalsCard } from "@/features/dashboard/goals-card";
import { UpcomingBills } from "@/features/dashboard/upcoming-bills";
import { AskAiCard } from "@/features/dashboard/ask-ai-card";
import { user, netWorth } from "@/data/finance";
import { DEMO_NOW } from "@/lib/format";
import { pick } from "@/lib/localized";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("dashboard") };
}

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lc = (await getLocale()) as Locale;
  const t = await getTranslations("dashboard");

  const hour = DEMO_NOW.getHours();
  const greetingKey =
    hour < 12 ? "greetingMorning" : hour < 18 ? "greetingAfternoon" : "greetingEvening";

  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
          {t(greetingKey, { name: pick(user.firstName, lc) })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>

      <MonthStats />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <NetWorthCard netWorth={netWorth} />
          <QuickActions />
          <SpendingBreakdown />
          <RecentActivity />
        </div>
        <div className="space-y-6">
          <AccountsCard />
          <GoalsCard />
          <UpcomingBills />
          <AskAiCard />
        </div>
      </div>
    </div>
  );
}
