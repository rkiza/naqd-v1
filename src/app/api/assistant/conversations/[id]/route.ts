import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Fetch a single conversation (with its messages) owned by the user. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const convo = await prisma.conversation.findFirst({
    where: { id, userId: session.user.id },
    select: {
      id: true,
      title: true,
      messages: {
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        select: { role: true, content: true, kind: true, payload: true },
      },
    },
  });

  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Merge current action state into action-card messages so reloaded cards
  // show their final status (and pending ones stay confirmable).
  const actionIds = convo.messages
    .filter((m) => m.kind === "action")
    .map((m) => (m.payload as { actionId?: string } | null)?.actionId)
    .filter((v): v is string => Boolean(v));
  const actions = actionIds.length
    ? await prisma.assistantAction.findMany({
        where: { id: { in: actionIds }, userId: session.user.id },
        select: { id: true, type: true, status: true, payload: true, result: true },
      })
    : [];
  const actionById = new Map(actions.map((a) => [a.id, a]));

  const messages = convo.messages.map((m) => {
    if (m.kind === "action") {
      const actionId = (m.payload as { actionId?: string } | null)?.actionId;
      const action = actionId ? actionById.get(actionId) : undefined;
      return { role: m.role, content: m.content, kind: m.kind, action: action ?? null };
    }
    if (m.kind === "portfolio") {
      return { role: m.role, content: m.content, kind: m.kind, card: m.payload };
    }
    return { role: m.role, content: m.content, kind: "text" };
  });

  return NextResponse.json({ id: convo.id, title: convo.title, messages });
}

/** Delete a conversation (and its messages via cascade) owned by the user. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.conversation.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
