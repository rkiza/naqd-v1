import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/features/admin/ui";

export const dynamic = "force-dynamic";

export default async function AdminChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      createdAt: true,
      user: { select: { email: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { id: true, role: true, content: true, createdAt: true },
      },
    },
  });

  if (!convo) notFound();

  return (
    <div>
      <Link
        href="/admin/chats"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 rtl-flip" />
        Chats
      </Link>

      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{convo.title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {convo.user?.email ?? "—"} · {convo.messages.length} messages · started {fmtDateTime(convo.createdAt)}
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-xs sm:p-6">
        {convo.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No messages.</p>
        ) : (
          convo.messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[46rem] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-se-sm bg-primary text-primary-foreground"
                    : "rounded-ss-sm bg-surface-muted text-foreground",
                )}
              >
                <p className="mb-1 text-[0.7rem] uppercase tracking-wider opacity-60">
                  {m.role} · {fmtDateTime(m.createdAt)}
                </p>
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
