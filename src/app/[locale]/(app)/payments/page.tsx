import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { PaymentsScreen } from "@/features/payments/payments-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("payments") };
}

export default async function PaymentsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("payments");
  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <PaymentsScreen />
    </div>
  );
}
