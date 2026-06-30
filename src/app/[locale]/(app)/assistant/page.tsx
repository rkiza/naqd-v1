import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { AssistantScreen } from "@/features/assistant/assistant-screen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("nav");
  return { title: t("assistant") };
}

export default async function AssistantPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AssistantScreen />;
}
