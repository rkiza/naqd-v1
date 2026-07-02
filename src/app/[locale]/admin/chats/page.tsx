import { ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { PageTitle, Panel, Empty, fmtDateTime } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminChatsPage() {
  const conversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      title: true,
      updatedAt: true,
      user: { select: { email: true } },
      _count: { select: { messages: true } },
    },
  });

  return (
    <div>
      <PageTitle title="Chats" subtitle="Every assistant conversation across all users." />
      <Panel title={`${conversations.length} conversations`}>
        {conversations.length === 0 ? (
          <Empty>No conversations yet.</Empty>
        ) : (
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-subtle-foreground">
                <th className="px-5 py-2.5 text-start font-medium">Title</th>
                <th className="px-5 py-2.5 text-start font-medium">User</th>
                <th className="px-5 py-2.5 text-end font-medium">Messages</th>
                <th className="px-5 py-2.5 text-end font-medium">Updated</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => (
                <tr key={c.id} className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-muted">
                  <td className="px-5 py-2.5">
                    <Link href={`/admin/chats/${c.id}`} className="font-medium text-foreground hover:underline">
                      {c.title}
                    </Link>
                  </td>
                  <td className="px-5 py-2.5 text-muted-foreground">{c.user?.email ?? "—"}</td>
                  <td className="px-5 py-2.5 text-end tnum text-muted-foreground">{c._count.messages}</td>
                  <td className="whitespace-nowrap px-5 py-2.5 text-end text-xs text-muted-foreground">
                    {fmtDateTime(c.updatedAt)}
                  </td>
                  <td className="px-3 py-2.5 text-end">
                    <Link href={`/admin/chats/${c.id}`} className="inline-grid h-7 w-7 place-items-center rounded-lg text-subtle-foreground hover:bg-accent hover:text-foreground">
                      <ChevronRight className="h-4 w-4 rtl-flip" />
                    </Link>
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
