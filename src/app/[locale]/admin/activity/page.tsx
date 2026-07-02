import { prisma } from "@/lib/db";
import { PageTitle, Panel, Empty, ActionChip, Ip, fmtDateTime } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { id: true, action: true, detail: true, email: true, ip: true, createdAt: true },
  });

  return (
    <div>
      <PageTitle title="Activity" subtitle="Full audit trail of actions across the system." />
      <Panel title={`Latest ${logs.length} events`}>
        {logs.length === 0 ? (
          <Empty>No activity recorded yet.</Empty>
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
              {logs.map((r) => (
                <tr key={r.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-2.5"><ActionChip action={r.action} /></td>
                  <td className="px-5 py-2.5 text-muted-foreground">{r.email ?? "—"}</td>
                  <td className="max-w-[300px] truncate px-5 py-2.5 text-foreground">{r.detail ?? "—"}</td>
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
  );
}
