import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { DEMO_EMAILS } from "@/config/demo";
import { DemoScreen, type DemoUser } from "@/features/demo/demo-screen";
import type { Localized } from "@/lib/localized";
import { loc } from "@/lib/localized";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("demo");
  return { title: t("title") };
}

function asLocalized(value: unknown, fallback: Localized): Localized {
  if (value && typeof value === "object" && "en" in value && "ar" in value) return value as Localized;
  return fallback;
}

export default async function DemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Only the curated demo accounts, and never an admin (defence in depth).
  const rows = await prisma.user.findMany({
    where: { email: { in: [...DEMO_EMAILS] }, role: { not: "ADMIN" } },
    select: {
      email: true,
      name: true,
      firstName: true,
      accountType: true,
      companyMembership: {
        select: { role: true, company: { select: { name: true } } },
      },
    },
  });

  const order = new Map<string, number>(DEMO_EMAILS.map((e, i) => [e, i]));
  const users: DemoUser[] = rows
    .sort((a, b) => (order.get(a.email) ?? 99) - (order.get(b.email) ?? 99))
    .map((u) => {
      const kind: DemoUser["kind"] =
        u.companyMembership?.role === "OWNER"
          ? "owner"
          : u.companyMembership?.role === "EMPLOYEE"
            ? "employee"
            : "personal";
      return {
        email: u.email,
        name: asLocalized(u.name, loc("naqd User", "مستخدم نقد")),
        firstName: asLocalized(u.firstName, loc("User", "مستخدم")),
        kind,
        companyName: u.companyMembership?.company?.name
          ? asLocalized(u.companyMembership.company.name, loc("Company", "شركة"))
          : null,
      };
    });

  return <DemoScreen users={users} />;
}
