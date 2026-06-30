import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { InvestmentScreen } from "@/features/investment/investment-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("investment") };
}

export default async function InvestmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("investment");
  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <InvestmentScreen />
    </div>
  );
}
