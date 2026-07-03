import { prisma } from "@/lib/db";
import { loc, type Localized } from "@/lib/localized";
import type { CompanyRole } from "@prisma/client";

export type CompanyEmployee = {
  userId: string;
  email: string;
  name: Localized;
  title: Localized | null;
  role: CompanyRole;
  canTopup: boolean;
  canSpend: boolean;
  spendLimit: number | null;
  walletBalance: number;
  monthSpend: number;
  lastActivity: string | null;
  joined: string;
};

export type CompanyContext = {
  company: { id: string; name: Localized; crNumber: string | null; currency: string };
  owner: { userId: string; email: string; name: Localized };
  treasury: number;
  employees: CompanyEmployee[];
  employeeCount: number;
  totalEmployeeWallet: number;
  totalEmployeeSpend: number;
};

function asLocalized(value: unknown, fallback: Localized): Localized {
  if (value && typeof value === "object" && "en" in value && "ar" in value) {
    return value as Localized;
  }
  return fallback;
}

/**
 * Aggregate a company for the owner console: treasury (owner's own wallet) plus
 * each employee's wallet balance, month spend, and last activity — all read from
 * real DB rows so the dashboard and assistant stay consistent.
 */
export async function getCompanyContext(companyId: string): Promise<CompanyContext | null> {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      owner: { select: { id: true, email: true, name: true } },
      members: {
        include: { user: { select: { id: true, email: true, name: true, createdAt: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!company) return null;

  const employeeMemberships = company.members.filter((m) => m.role === "EMPLOYEE");
  const employeeIds = employeeMemberships.map((m) => m.userId);

  // Owner treasury = the owner's own non-investment balance.
  const treasuryAgg = await prisma.financeAccount.aggregate({
    where: { userId: company.ownerUserId, kind: { not: "investment" } },
    _sum: { balance: true },
  });

  const [walletByUser, spendByUser, lastActivityByUser] = await Promise.all([
    employeeIds.length
      ? prisma.financeAccount.groupBy({
          by: ["userId"],
          where: { userId: { in: employeeIds }, kind: { not: "investment" } },
          _sum: { balance: true },
        })
      : Promise.resolve([]),
    employeeIds.length
      ? prisma.spendingSlice.groupBy({
          by: ["userId"],
          where: { userId: { in: employeeIds } },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
    employeeIds.length
      ? prisma.transaction.groupBy({
          by: ["userId"],
          where: { userId: { in: employeeIds } },
          _max: { date: true },
        })
      : Promise.resolve([]),
  ]);

  const wallet = new Map(walletByUser.map((r) => [r.userId, r._sum.balance ?? 0]));
  const spend = new Map(spendByUser.map((r) => [r.userId, r._sum.amount ?? 0]));
  const last = new Map(lastActivityByUser.map((r) => [r.userId, r._max.date ?? null]));

  const employees: CompanyEmployee[] = employeeMemberships.map((m) => ({
    userId: m.userId,
    email: m.user.email,
    name: asLocalized(m.user.name, loc("Employee", "موظف")),
    title: m.title ? asLocalized(m.title, loc("", "")) : null,
    role: m.role,
    canTopup: m.canTopup,
    canSpend: m.canSpend,
    spendLimit: m.spendLimit,
    walletBalance: wallet.get(m.userId) ?? 0,
    monthSpend: spend.get(m.userId) ?? 0,
    lastActivity: last.get(m.userId)?.toISOString() ?? null,
    joined: m.user.createdAt.toISOString().slice(0, 10),
  }));

  return {
    company: {
      id: company.id,
      name: asLocalized(company.name, loc("Company", "شركة")),
      crNumber: company.crNumber,
      currency: company.currency,
    },
    owner: {
      userId: company.owner.id,
      email: company.owner.email,
      name: asLocalized(company.owner.name, loc("Owner", "المالك")),
    },
    treasury: treasuryAgg._sum.balance ?? 0,
    employees,
    employeeCount: employees.length,
    totalEmployeeWallet: employees.reduce((s, e) => s + e.walletBalance, 0),
    totalEmployeeSpend: employees.reduce((s, e) => s + e.monthSpend, 0),
  };
}

/** Single-employee detail for the owner, verifying company ownership of the row. */
export async function getCompanyEmployee(companyId: string, userId: string) {
  const membership = await prisma.companyMembership.findFirst({
    where: { companyId, userId, role: "EMPLOYEE" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          transactions: { orderBy: { date: "desc" }, take: 12 },
        },
      },
    },
  });
  if (!membership) return null;

  const [walletAgg, spendAgg] = await Promise.all([
    prisma.financeAccount.aggregate({
      where: { userId, kind: { not: "investment" } },
      _sum: { balance: true },
    }),
    prisma.spendingSlice.aggregate({ where: { userId }, _sum: { amount: true } }),
  ]);

  return {
    userId: membership.userId,
    email: membership.user.email,
    name: asLocalized(membership.user.name, loc("Employee", "موظف")),
    title: membership.title ? asLocalized(membership.title, loc("", "")) : null,
    canTopup: membership.canTopup,
    canSpend: membership.canSpend,
    spendLimit: membership.spendLimit,
    walletBalance: walletAgg._sum.balance ?? 0,
    monthSpend: spendAgg._sum.amount ?? 0,
    joined: membership.user.createdAt.toISOString().slice(0, 10),
    transactions: membership.user.transactions.map((t) => ({
      id: t.extId,
      merchant: asLocalized(t.merchant, loc("Merchant", "تاجر")),
      category: t.category,
      type: t.type,
      amount: t.amount,
      date: t.date.toISOString(),
    })),
  };
}
