import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { DashboardHeader } from "@/features/dashboard/dashboard-header";
import { NetWorthCard } from "@/features/dashboard/net-worth-card";
import { QuickActions } from "@/features/dashboard/quick-actions";
import { MonthStats } from "@/features/dashboard/month-stats";
import { SpendingBreakdown } from "@/features/dashboard/spending-breakdown";
import { RecentActivity } from "@/features/dashboard/recent-activity";
import { AccountsCard } from "@/features/dashboard/accounts-card";
import { GoalsCard } from "@/features/dashboard/goals-card";
import { UpcomingBills } from "@/features/dashboard/upcoming-bills";
import { AskAiCard } from "@/features/dashboard/ask-ai-card";

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

  return (
    <div className="space-y-6">
      <DashboardHeader />

      <MonthStats />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <NetWorthCard />
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
