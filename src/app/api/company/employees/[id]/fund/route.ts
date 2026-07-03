import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyOwner } from "@/server/company/require-company";
import { fundEmployeeWallet } from "@/server/company/fund-employee";
import { logActivity } from "@/server/admin/audit";

/** Owner-only: fund an employee's wallet (real, persisting top-up). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const owner = await getCompanyOwner();
  if (!owner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const membership = await prisma.companyMembership.findFirst({
    where: { companyId: owner.companyId, userId: id, role: "EMPLOYEE" },
    select: { id: true, user: { select: { email: true } } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { amount?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }
  if (amount > 1_000_000) {
    return NextResponse.json({ error: "Amount too large" }, { status: 400 });
  }

  const result = await fundEmployeeWallet(id, amount);
  if (!result) {
    return NextResponse.json({ error: "No account found" }, { status: 404 });
  }

  const rounded = Math.round(amount * 100) / 100;
  await logActivity({
    action: "company.fund",
    userId: owner.userId,
    email: owner.email,
    detail: `Funded ${membership.user.email} wallet with SAR ${rounded.toLocaleString("en-US")}`,
    req,
  });

  return NextResponse.json({ ok: true, balance: result.balance });
}
