import { prisma } from "@/lib/db";
import { PageTitle, Panel, Empty, Ip, fmtDateTime } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminLoginsPage() {
  const logins = await prisma.auditLog.findMany({
    where: { action: "auth.login" },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { id: true, email: true, ip: true, userAgent: true, createdAt: true },
  });

  return (
    <div>
      <PageTitle title="Logins" subtitle="Sign-in events with originating IP address." />
      <Panel title={`Latest ${logins.length} logins`}>
        {logins.length === 0 ? (
          <Empty>No logins recorded yet.</Empty>
        ) : (
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-subtle-foreground">
                <th className="px-5 py-2.5 text-start font-medium">User</th>
                <th className="px-5 py-2.5 text-start font-medium">IP</th>
                <th className="px-5 py-2.5 text-start font-medium">Device</th>
                <th className="px-5 py-2.5 text-end font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {logins.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-2.5 font-medium text-foreground">{r.email ?? "—"}</td>
                  <td className="px-5 py-2.5"><Ip value={r.ip} /></td>
                  <td className="max-w-[360px] truncate px-5 py-2.5 text-xs text-muted-foreground" dir="ltr">
                    {r.userAgent ?? "—"}
                  </td>
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
