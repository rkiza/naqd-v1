import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyOwner } from "@/server/company/require-company";
import { logActivity } from "@/server/admin/audit";

/** Owner-only: update an employee's access flags & spend limit. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const owner = await getCompanyOwner();
  if (!owner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  // Ownership check: the target must be an EMPLOYEE of the caller's company.
  const membership = await prisma.companyMembership.findFirst({
    where: { companyId: owner.companyId, userId: id, role: "EMPLOYEE" },
    select: { id: true, user: { select: { email: true } } },
  });
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: { canSpend?: boolean; canTopup?: boolean; spendLimit?: number | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const spendLimit =
    body.spendLimit != null && Number.isFinite(Number(body.spendLimit)) && Number(body.spendLimit) > 0
      ? Number(body.spendLimit)
      : null;

  await prisma.companyMembership.update({
    where: { id: membership.id },
    data: {
      canSpend: body.canSpend ?? undefined,
      canTopup: body.canTopup ?? undefined,
      spendLimit,
    },
  });

  await logActivity({
    action: "company.access.update",
    userId: owner.userId,
    email: owner.email,
    detail: `Updated access for ${membership.user.email} (spend=${body.canSpend}, topup=${body.canTopup}, limit=${spendLimit ?? "none"})`,
    req,
  });

  return NextResponse.json({ ok: true });
}
