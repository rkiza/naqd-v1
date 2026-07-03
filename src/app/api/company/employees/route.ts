import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCompanyOwner } from "@/server/company/require-company";
import { provisionEmployee } from "@/server/company/seed-company";
import { fundEmployeeWallet } from "@/server/company/fund-employee";
import { isEmail, normalizeEmail } from "@/lib/auth/resolve-user";
import { logActivity } from "@/server/admin/audit";

/** Owner-only: create an employee under the caller's company. */
export async function POST(req: Request) {
  const owner = await getCompanyOwner();
  if (!owner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    name?: string;
    email?: string;
    title?: string;
    spendLimit?: number | null;
    initialFund?: number;
    canSpend?: boolean;
    canTopup?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const name = body.name?.trim() ?? "";
  const email = normalizeEmail(body.email ?? "");
  if (!name || !isEmail(email)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Guard: an already-registered user cannot be silently pulled into the company.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { companyMembership: { select: { id: true } } },
  });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const spendLimit =
    body.spendLimit != null && Number.isFinite(Number(body.spendLimit)) && Number(body.spendLimit) > 0
      ? Number(body.spendLimit)
      : null;

  const provisioned = await provisionEmployee(owner.companyId, {
    email,
    name,
    title: body.title?.trim() || undefined,
    canSpend: body.canSpend ?? true,
    canTopup: body.canTopup ?? false,
    spendLimit,
    factor: 0.12,
  });

  // Optional starting wallet top-up.
  const initialFund = Number(body.initialFund);
  if (Number.isFinite(initialFund) && initialFund > 0 && initialFund <= 1_000_000) {
    await fundEmployeeWallet(provisioned.userId, initialFund);
  }

  await logActivity({
    action: "company.employee.add",
    userId: owner.userId,
    email: owner.email,
    detail: `Added employee ${name} <${email}>`,
    req,
  });

  return NextResponse.json({
    ok: true,
    userId: provisioned.userId,
    email: provisioned.email,
    tempPassword: provisioned.tempPassword,
  });
}
