import { Wallet, Users, CreditCard, TrendingDown } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { requireCompanyOwner } from "@/server/company/require-company";
import { getCompanyContext } from "@/server/company/get-company-context";
import { PageTitle, StatTile, Panel, Empty, ActionChip, Ip, fmtDateTime } from "@/features/admin/ui";
import { formatCurrency } from "@/lib/format";
import { pick } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export default async function CompanyOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lo = locale as Locale;
  const owner = await requireCompanyOwner(locale);
  const t = await getTranslations("company");

  const ctx = await getCompanyContext(owner.companyId);
  if (!ctx) return null;

  const memberIds = [ctx.owner.userId, ...ctx.employees.map((e) => e.userId)];
  const recent = await prisma.auditLog.findMany({
    where: { userId: { in: memberIds } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { id: true, action: true, detail: true, email: true, ip: true, createdAt: true },
  });

  return (
    <div>
      <PageTitle title={t("overview")} subtitle={t("overviewSubtitle")} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t("treasury")}
          value={formatCurrency(ctx.treasury, lo, { compact: true })}
          icon={<Wallet className="h-4 w-4" />}
        />
        <StatTile
          label={t("headcount")}
          value={ctx.employeeCount}
          icon={<Users className="h-4 w-4" />}
        />
        <StatTile
          label={t("teamWallets")}
          value={formatCurrency(ctx.totalEmployeeWallet, lo, { compact: true })}
          icon={<CreditCard className="h-4 w-4" />}
        />
        <StatTile
          label={t("teamSpend")}
          value={formatCurrency(ctx.totalEmployeeSpend, lo, { compact: true })}
          icon={<TrendingDown className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <Panel
          title={t("employees")}
          action={
            <Link href="/company/employees" className="text-xs font-medium text-primary-strong hover:underline">
              {t("viewAll")}
            </Link>
          }
        >
          {ctx.employees.length === 0 ? (
            <Empty>{t("noEmployees")}</Empty>
          ) : (
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-subtle-foreground">
                  <th className="px-5 py-2.5 text-start font-medium">{t("colEmployee")}</th>
                  <th className="px-5 py-2.5 text-end font-medium">{t("colWallet")}</th>
                  <th className="px-5 py-2.5 text-end font-medium">{t("colSpend")}</th>
                </tr>
              </thead>
              <tbody>
                {ctx.employees.map((e) => (
                  <tr key={e.userId} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-2.5">
                      <Link href={`/company/employees/${e.userId}`} className="font-medium text-foreground hover:underline">
                        {pick(e.name, lo)}
                      </Link>
                      {e.title && <p className="text-xs text-muted-foreground">{pick(e.title, lo)}</p>}
                    </td>
                    <td className="px-5 py-2.5 text-end tnum text-foreground">
                      {formatCurrency(e.walletBalance, lo, { decimals: 0 })}
                    </td>
                    <td className="px-5 py-2.5 text-end tnum text-muted-foreground">
                      {formatCurrency(e.monthSpend, lo, { decimals: 0 })}
                      {e.spendLimit != null && (
                        <span className="text-subtle-foreground"> / {formatCurrency(e.spendLimit, lo, { decimals: 0 })}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title={t("recentActivity")}>
          {recent.length === 0 ? (
            <Empty>{t("noActivity")}</Empty>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-subtle-foreground">
                  <th className="px-5 py-2.5 text-start font-medium">Action</th>
                  <th className="px-5 py-2.5 text-start font-medium">User</th>
                  <th className="px-5 py-2.5 text-start font-medium">Detail</th>
                  <th className="px-5 py-2.5 text-start font-medium">IP</th>
                  <th className="px-5 py-2.5 text-end font-medium">When</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-2.5"><ActionChip action={r.action} /></td>
                    <td className="px-5 py-2.5 text-muted-foreground">{r.email ?? "—"}</td>
                    <td className="max-w-[260px] truncate px-5 py-2.5 text-foreground">{r.detail ?? "—"}</td>
                    <td className="px-5 py-2.5"><Ip value={r.ip} /></td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-end text-xs text-muted-foreground">
                      {fmtDateTime(r.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </div>
  );
}
