import { Users, MessagesSquare, LogIn, Activity, Shield, Building2, UserCog, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { PageTitle, StatTile, Panel, Empty, ActionChip, Ip, fmtDateTime } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [users, admins, companies, employees, conversations, messages, logins24h, actions24h, recent] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.company.count(),
      prisma.companyMembership.count({ where: { role: "EMPLOYEE" } }),
      prisma.conversation.count(),
      prisma.chatMessage.count(),
      prisma.auditLog.count({ where: { action: "auth.login", createdAt: { gte: since } } }),
      prisma.auditLog.count({ where: { createdAt: { gte: since } } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 12,
        select: { id: true, action: true, detail: true, email: true, ip: true, createdAt: true },
      }),
    ]);

  return (
    <div>
      <PageTitle title="Overview" subtitle="System activity at a glance." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Users" value={users} icon={<Users className="h-4 w-4" />} />
        <StatTile label="Companies" value={companies} icon={<Building2 className="h-4 w-4" />} />
        <StatTile label="Employees" value={employees} icon={<UserCog className="h-4 w-4" />} />
        <StatTile label="Admins" value={admins} icon={<Shield className="h-4 w-4" />} />
        <StatTile label="Chats" value={conversations} icon={<MessagesSquare className="h-4 w-4" />} />
        <StatTile label="Messages" value={messages} icon={<MessageCircle className="h-4 w-4" />} />
        <StatTile label="Logins 24h" value={logins24h} icon={<LogIn className="h-4 w-4" />} />
        <StatTile label="Actions 24h" value={actions24h} icon={<Activity className="h-4 w-4" />} />
      </div>

      <div className="mt-6">
        <Panel
          title="Recent activity"
          action={
            <Link href="/admin/activity" className="text-xs font-medium text-primary-strong hover:underline">
              View all
            </Link>
          }
        >
          {recent.length === 0 ? (
            <Empty>No activity yet.</Empty>
          ) : (
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-start text-xs text-subtle-foreground">
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
