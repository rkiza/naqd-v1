import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { FinanceProvider } from "@/components/finance/finance-provider";
import { auth } from "@/auth";
import { getFinanceContext } from "@/server/finance/get-finance-context";

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

  return (
    <FinanceProvider value={finance}>
      <AppShell>{children}</AppShell>
    </FinanceProvider>
  );
}
