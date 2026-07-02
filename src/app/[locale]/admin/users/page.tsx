import { prisma } from "@/lib/db";
import { PageTitle, Panel, Empty, RoleChip, fmtDateTime } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      _count: { select: { conversations: true, auditLogs: true } },
    },
  });

  return (
    <div>
      <PageTitle title="Users" subtitle={`${users.length} registered ${users.length === 1 ? "account" : "accounts"}.`} />
      <Panel title="All users">
        {users.length === 0 ? (
          <Empty>No users.</Empty>
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-subtle-foreground">
                <th className="px-5 py-2.5 text-start font-medium">Email</th>
                <th className="px-5 py-2.5 text-start font-medium">Phone</th>
                <th className="px-5 py-2.5 text-start font-medium">Role</th>
                <th className="px-5 py-2.5 text-end font-medium">Chats</th>
                <th className="px-5 py-2.5 text-end font-medium">Actions</th>
                <th className="px-5 py-2.5 text-end font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-2.5 font-medium text-foreground">{u.email}</td>
                  <td className="px-5 py-2.5 text-muted-foreground" dir="ltr">{u.phone ?? "—"}</td>
                  <td className="px-5 py-2.5"><RoleChip role={u.role} /></td>
                  <td className="px-5 py-2.5 text-end tnum text-muted-foreground">{u._count.conversations}</td>
                  <td className="px-5 py-2.5 text-end tnum text-muted-foreground">{u._count.auditLogs}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-end text-xs text-muted-foreground">
                    {fmtDateTime(u.createdAt)}
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
