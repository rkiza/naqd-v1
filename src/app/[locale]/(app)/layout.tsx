import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { FinanceProvider } from "@/components/finance/finance-provider";
import { auth } from "@/auth";
import { getFinanceContext } from "@/server/finance/get-finance-context";
import { getDashboardOrg } from "@/server/company/get-company-context";

export default async function AppLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/${locale}/login`);
  }

  const finance = await getFinanceContext(session.user.id);
  if (!finance) {
    redirect(`/${locale}/login`);
  }

  // Attach company/membership context (DB-authoritative). Owners get the full
  // treasury + employee snapshot; employees get only their own access flags.
  const org = await getDashboardOrg(session.user.id);

  return (
    <FinanceProvider value={{ ...finance, ...org }}>
      <AppShell>{children}</AppShell>
    </FinanceProvider>
  );
}
