import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/server/admin/audit";
import { getDashboardOrg } from "@/server/company/get-company-context";
import {
  executeAction,
  membershipGate,
  type ActionPayload,
} from "@/server/assistant/actions";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Resolve a pending AI-proposed action: the user tapped Confirm or Cancel on
 * the in-chat card. Everything is re-validated server-side against the DB —
 * ownership, pending status, company access flags, and (inside the execution
 * transaction) balances/units.
 */
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: { decision?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const decision = body.decision === "confirm" ? "confirm" : body.decision === "decline" ? "decline" : null;
  if (!decision) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // Ownership is part of the query — a foreign action id is a plain 404.
  const action = await prisma.assistantAction.findFirst({ where: { id, userId } });
  if (!action) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (action.status !== "pending") {
    return NextResponse.json(
      { error: "Already resolved", status: action.status, result: action.result },
      { status: 409 },
    );
  }

  const payload = action.payload as unknown as ActionPayload;
  const email = session.user.email ?? null;

  if (decision === "decline") {
    const updated = await prisma.assistantAction.update({
      where: { id: action.id },
      data: { status: "declined" },
    });
    await logActivity({
      action: "assistant.action.decline",
      userId,
      email,
      detail: `${action.type} ${action.id}`,
      req,
    });
    return NextResponse.json({ id: updated.id, status: updated.status, result: null });
  }

  // Confirm — re-check company access flags fresh from the DB (they may have
  // changed since the proposal), then settle atomically.
  if (payload.kind === "send_money") {
    const org = await getDashboardOrg(userId);
    const gate = membershipGate(org.membership, payload.amount);
    if (gate) {
      const updated = await prisma.assistantAction.update({
        where: { id: action.id },
        data: { status: "failed", result: { reason: gate } },
      });
      return NextResponse.json({ id: updated.id, status: updated.status, result: updated.result });
    }
  }

  const outcome = await executeAction(userId, payload);
  const updated = await prisma.assistantAction.update({
    where: { id: action.id },
    data: outcome.ok
      ? {
          status: "executed",
          executedAt: new Date(),
          result: outcome.result as Prisma.InputJsonValue,
        }
      : {
          status: "failed",
          result: { reason: outcome.error, detail: outcome.detail ?? null },
        },
  });

  await logActivity({
    action: "assistant.action.confirm",
    userId,
    email,
    detail: outcome.ok
      ? `${action.type} executed (${action.id})`
      : `${action.type} failed: ${outcome.error} (${action.id})`,
    req,
  });

  return NextResponse.json({ id: updated.id, status: updated.status, result: updated.result });
}
