import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const portfolio = await prisma.marketPortfolio.findUnique({
    where: { userId: session.user.id },
  });

  if (!portfolio) {
    return NextResponse.json({
      cash: 92650.75,
      positions: {},
      watchlist: [],
      orders: [],
    });
  }

  return NextResponse.json({
    cash: portfolio.cash,
    positions: portfolio.positions,
    watchlist: portfolio.watchlist,
    orders: portfolio.orders,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    cash?: number;
    positions?: Record<string, { units: number; avgCost: number }>;
    watchlist?: string[];
    orders?: unknown[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const portfolio = await prisma.marketPortfolio.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      cash: body.cash ?? 92650.75,
      positions: (body.positions ?? {}) as Prisma.InputJsonValue,
      watchlist: (body.watchlist ?? []) as Prisma.InputJsonValue,
      orders: (body.orders ?? []) as Prisma.InputJsonValue,
    },
    update: {
      cash: body.cash,
      positions: body.positions as Prisma.InputJsonValue,
      watchlist: body.watchlist as Prisma.InputJsonValue,
      orders: body.orders as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({
    cash: portfolio.cash,
    positions: portfolio.positions,
    watchlist: portfolio.watchlist,
    orders: portfolio.orders,
  });
}
