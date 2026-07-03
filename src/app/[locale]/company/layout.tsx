import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { requireCompanyOwner } from "@/server/company/require-company";
import { CompanyShell } from "@/features/company/company-shell";
import { pick, type Localized } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Company · naqd",
  robots: { index: false, follow: false },
};

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const owner = await requireCompanyOwner(locale);

  const company = await prisma.company.findUnique({
    where: { id: owner.companyId },
    select: { name: true },
  });
  const companyName = company?.name
    ? pick(company.name as Localized, locale as Locale)
    : "naqd Business";

  return (
    <CompanyShell companyName={companyName} ownerEmail={owner.email}>
      {children}
    </CompanyShell>
  );
}
