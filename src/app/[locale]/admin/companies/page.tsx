import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { PageTitle, Panel, Empty, fmtDateTime } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

function localizedEn(value: unknown): string {
  if (value && typeof value === "object" && "en" in value) {
    return String((value as { en: string }).en);
  }
  return "—";
}

function sar(value: number): string {
  return `SAR ${Math.round(value).toLocaleString("en-US")}`;
}

export default async function AdminCompaniesPage() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      owner: { select: { id: true, email: true } },
      members: { select: { userId: true, role: true } },
    },
  });

  const ownerIds = companies.map((c) => c.owner.id);
  const employeeIds = companies.flatMap((c) =>
    c.members.filter((m) => m.role === "EMPLOYEE").map((m) => m.userId),
  );

  const [treasuryByUser, spendByUser] = await Promise.all([
    ownerIds.length
      ? prisma.financeAccount.groupBy({
          by: ["userId"],
          where: { userId: { in: ownerIds }, kind: { not: "investment" } },
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
  ]);

  const treasury = new Map(treasuryByUser.map((r) => [r.userId, r._sum.balance ?? 0]));
  const spend = new Map(spendByUser.map((r) => [r.userId, r._sum.amount ?? 0]));

  const rows = companies.map((c) => {
    const employees = c.members.filter((m) => m.role === "EMPLOYEE");
    return {
      id: c.id,
      name: localizedEn(c.name),
      crNumber: c.crNumber,
      ownerEmail: c.owner.email,
      employeeCount: employees.length,
      treasury: treasury.get(c.owner.id) ?? 0,
      teamSpend: employees.reduce((s, e) => s + (spend.get(e.userId) ?? 0), 0),
      createdAt: c.createdAt,
    };
  });

  return (
    <div>
      <PageTitle
        title="Companies"
        subtitle={`${rows.length} business ${rows.length === 1 ? "account" : "accounts"} on the platform.`}
      />
      <Panel title="All companies">
        {rows.length === 0 ? (
          <Empty>No companies yet.</Empty>
        ) : (
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-subtle-foreground">
                <th className="px-5 py-2.5 text-start font-medium">Company</th>
                <th className="px-5 py-2.5 text-start font-medium">Owner</th>
                <th className="px-5 py-2.5 text-end font-medium">Employees</th>
                <th className="px-5 py-2.5 text-end font-medium">Treasury</th>
                <th className="px-5 py-2.5 text-end font-medium">Team spend (mo)</th>
                <th className="px-5 py-2.5 text-end font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-2.5">
                    <Link href={`/admin/companies/${r.id}`} className="font-medium text-foreground hover:underline">
                      {r.name}
                    </Link>
                    {r.crNumber && <p className="font-mono text-xs text-subtle-foreground" dir="ltr">CR {r.crNumber}</p>}
                  </td>
                  <td className="px-5 py-2.5 text-muted-foreground" dir="ltr">{r.ownerEmail}</td>
                  <td className="px-5 py-2.5 text-end tnum text-foreground">{r.employeeCount}</td>
                  <td className="px-5 py-2.5 text-end tnum text-foreground">{sar(r.treasury)}</td>
                  <td className="px-5 py-2.5 text-end tnum text-muted-foreground">{sar(r.teamSpend)}</td>
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
  );
}
