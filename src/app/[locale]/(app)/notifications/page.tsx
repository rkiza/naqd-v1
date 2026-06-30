import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationsScreen } from "@/features/notifications/notifications-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("notifications") };
}

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("notifications");
  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <NotificationsScreen />
    </div>
  );
}
