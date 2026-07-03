import { ArrowLeft, Wallet, Users, CreditCard, TrendingDown } from "lucide-react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { getCompanyContext } from "@/server/company/get-company-context";
import { PageTitle, StatTile, Panel, Empty, ActionChip, Ip, fmtDateTime } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

function en(value: unknown): string {
  if (value && typeof value === "object" && "en" in value) return String((value as { en: string }).en);
  return "—";
}
function sar(value: number): string {
  return `SAR ${Math.round(value).toLocaleString("en-US")}`;
}

function AccessChip({ on, label }: { on: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-medium ${
        on ? "bg-positive-soft text-positive" : "bg-surface-muted text-subtle-foreground line-through"
      }`}
    >
      {label}
    </span>
  );
}

export default async function AdminCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [ctx, meta] = await Promise.all([
    getCompanyContext(id),
    prisma.company.findUnique({ where: { id }, select: { crNumber: true, createdAt: true } }),
  ]);
  if (!ctx || !meta) notFound();

  const memberIds = [ctx.owner.userId, ...ctx.employees.map((e) => e.userId)];
  const activity = await prisma.auditLog.findMany({
    where: { userId: { in: memberIds } },
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, action: true, detail: true, email: true, ip: true, createdAt: true },
  });

  return (
    <div>
      <Link
        href="/admin/companies"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Back to companies
      </Link>

      <PageTitle
        title={en(ctx.company.name)}
        subtitle={`Owner ${ctx.owner.email}${meta.crNumber ? ` · CR ${meta.crNumber}` : ""} · Created ${fmtDateTime(meta.createdAt)}`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Treasury" value={sar(ctx.treasury)} icon={<Wallet className="h-4 w-4" />} />
        <StatTile label="Employees" value={ctx.employeeCount} icon={<Users className="h-4 w-4" />} />
        <StatTile label="Team wallets" value={sar(ctx.totalEmployeeWallet)} icon={<CreditCard className="h-4 w-4" />} />
        <StatTile label="Team spend (mo)" value={sar(ctx.totalEmployeeSpend)} icon={<TrendingDown className="h-4 w-4" />} />
      </div>

      <div className="mt-6">
        <Panel title={`Employees (${ctx.employeeCount})`}>
          {ctx.employees.length === 0 ? (
            <Empty>No employees.</Empty>
          ) : (
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-subtle-foreground">
                  <th className="px-5 py-2.5 text-start font-medium">Employee</th>
                  <th className="px-5 py-2.5 text-end font-medium">Wallet</th>
                  <th className="px-5 py-2.5 text-end font-medium">Spend / limit</th>
                  <th className="px-5 py-2.5 text-start font-medium">Access</th>
                  <th className="px-5 py-2.5 text-end font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {ctx.employees.map((e) => (
                  <tr key={e.userId} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{en(e.name)}</p>
                      <p className="text-xs text-muted-foreground" dir="ltr">{e.email}</p>
                      {e.title && <p className="text-xs text-subtle-foreground">{en(e.title)}</p>}
                    </td>
                    <td className="px-5 py-3 text-end tnum text-foreground">{sar(e.walletBalance)}</td>
                    <td className="px-5 py-3 text-end tnum text-muted-foreground">
                      {sar(e.monthSpend)}
                      <span className="text-subtle-foreground"> / {e.spendLimit != null ? sar(e.spendLimit) : "—"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <AccessChip on={e.canSpend} label="Spend" />
                        <AccessChip on={e.canTopup} label="Top-up" />
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-end text-xs text-muted-foreground">
                      {e.lastActivity ? fmtDateTime(e.lastActivity) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title="Company activity">
          {activity.length === 0 ? (
            <Empty>No activity recorded for this company yet.</Empty>
          ) : (
            <table className="w-full min-w-[720px] text-sm">
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
                {activity.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-2.5"><ActionChip action={r.action} /></td>
                    <td className="px-5 py-2.5 text-muted-foreground">{r.email ?? "—"}</td>
                    <td className="max-w-[280px] truncate px-5 py-2.5 text-foreground">{r.detail ?? "—"}</td>
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
