import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/auth";
import { loc } from "@/lib/localized";
import { logActivity } from "@/server/admin/audit";

/** Simulated wallet top-up. Credits a finance account and records an income
 * transaction, persisting both to the demo user's data in the database. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  let body: { amount?: number; accountId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  // Cap a single simulated top-up to keep the demo sensible.
  if (amount > 1_000_000) {
    return NextResponse.json({ error: "Amount too large" }, { status: 400 });
  }

  // Resolve the target account: the requested one, else the current account,
  // else the first available account.
  const requested = body.accountId
    ? await prisma.financeAccount.findFirst({
        where: { userId, extId: body.accountId },
      })
    : null;
  const account =
    requested ??
    (await prisma.financeAccount.findFirst({
      where: { userId, kind: "current" },
    })) ??
    (await prisma.financeAccount.findFirst({ where: { userId } }));

  if (!account) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const rounded = Math.round(amount * 100) / 100;
  const now = new Date();
  const extId = `tx_topup_${now.getTime()}`;

  const [, updated] = await prisma.$transaction([
    prisma.transaction.create({
      data: {
        userId,
        extId,
        merchant: loc("Wallet top-up", "شحن المحفظة"),
        note: loc("Added to wallet · Simulated", "أُضيفت إلى المحفظة · محاكاة"),
        category: "income",
        type: "income",
        status: "completed",
        method: "transfer",
        amount: rounded,
        date: now,
      },
    }),
    prisma.financeAccount.update({
      where: { id: account.id },
      data: { balance: { increment: rounded } },
    }),
  ]);

  await logActivity({
    action: "wallet.topup",
    userId,
    email: session.user.email ?? null,
    detail: `Top-up SAR ${rounded.toLocaleString("en-US")} to ${account.number}`,
    req,
  });

  return NextResponse.json({
    ok: true,
    amount: rounded,
    account: { id: updated.extId, balance: updated.balance },
    transactionId: extId,
  });
}
