import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/page-header";
import { WalletScreen } from "@/features/wallet/wallet-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("wallet") };
}

export default async function WalletPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("wallet");

  return (
    <div>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <WalletScreen />
    </div>
  );
}
