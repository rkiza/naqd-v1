import { prisma } from "@/lib/db";
import { loc, type Localized } from "@/lib/localized";
import { stockBySymbol, stocks, tradeCostSar } from "@/data/markets";
import type { MembershipInfo } from "@/server/company/get-company-context";
import type { Prisma } from "@prisma/client";

/**
 * AI-assistant money actions: shared validation + execution used by the chat
 * route (proposal cards) and the confirm endpoint. Nothing here executes
 * without an explicit user confirmation — the chat route only validates and
 * stores a "pending" AssistantAction; the confirm endpoint re-validates and
 * settles it atomically.
 */

export type ActionType = "send_money" | "buy_stock" | "sell_stock";

/** Machine-readable reasons — relayed to the model and localized by the UI. */
export type ActionError =
  | "invalid_amount"
  | "amount_too_large"
  | "beneficiary_not_found"
  | "no_account"
  | "insufficient_funds"
  | "spend_not_allowed"
  | "over_spend_limit"
  | "unknown_symbol"
  | "invalid_units"
  | "insufficient_cash"
  | "insufficient_units";

export type SendMoneyPayload = {
  kind: "send_money";
  beneficiaryExtId: string;
  beneficiaryName: Localized;
  bank: Localized;
  ibanLast4: string;
  /** SAR */
  amount: number;
  note?: string;
  /** Preview at proposal time — re-checked at execution. */
  balanceBefore: number;
};

export type TradePayload = {
  kind: "buy_stock" | "sell_stock";
  symbol: string;
  name: Localized;
  market: "sa" | "us";
  units: number;
  /** Native-currency price per unit (USD for US stocks). */
  price: number;
  currency: "SAR" | "USD";
  totalSar: number;
  /** Previews at proposal time — re-checked at execution. */
  cashBefore: number;
  unitsBefore: number;
};

export type ActionPayload = SendMoneyPayload | TradePayload;

export type Validation<T extends ActionPayload> =
  | { ok: true; payload: T }
  | { ok: false; error: ActionError; detail?: string };

export type ExecutionResult =
  | { ok: true; result: Prisma.JsonObject }
  | { ok: false; error: ActionError; detail?: string };

const MAX_SAR = 1_000_000; // demo-wide cap, consistent with wallet top-up / company funding

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Employee access gate (owners always pass — their flags default to full access). */
export function membershipGate(
  membership: MembershipInfo | undefined,
  amountSar: number,
): ActionError | null {
  if (!membership || membership.role !== "EMPLOYEE") return null;
  if (!membership.canSpend) return "spend_not_allowed";
  if (membership.spendLimit != null && amountSar > membership.spendLimit) return "over_spend_limit";
  return null;
}

/** Resolve a beneficiary by extId or (en/ar) name, scoped to the user. */
export async function resolveBeneficiary(userId: string, ref: string) {
  const all = await prisma.beneficiary.findMany({
    where: { userId },
    orderBy: { favorite: "desc" },
  });
  const needle = ref.trim().toLowerCase();
  if (!needle) return null;
  const nameOf = (b: (typeof all)[number]) => {
    const n = b.name as { en?: string; ar?: string } | null;
    return { en: (n?.en ?? "").toLowerCase(), ar: (n?.ar ?? "").toLowerCase() };
  };
  const byExt = all.find((b) => b.extId === ref);
  if (byExt) return byExt;
  const exact = all.find((b) => {
    const n = nameOf(b);
    return n.en === needle || n.ar === needle;
  });
  if (exact) return exact;
  const contains = all.find((b) => {
    const n = nameOf(b);
    return n.en.includes(needle) || n.ar.includes(needle);
  });
  if (contains) return contains;
  // Word-level fallback ("sara please", "سارة من فضلك"): any word of the
  // reference appearing in a beneficiary name.
  const words = needle.split(/\s+/).filter((w) => w.length >= 2);
  for (const w of words) {
    const hit = all.find((b) => {
      const n = nameOf(b);
      return n.en.includes(w) || n.ar.includes(w);
    });
    if (hit) return hit;
  }
  return null;
}

/** The user's spendable account: current first, else first available. */
async function spendableAccount(userId: string, tx: Prisma.TransactionClient | typeof prisma = prisma) {
  return (
    (await tx.financeAccount.findFirst({ where: { userId, kind: "current" } })) ??
    (await tx.financeAccount.findFirst({ where: { userId } }))
  );
}

export async function validateSendMoney(
  userId: string,
  membership: MembershipInfo | undefined,
  input: { beneficiary: string; amount: number; note?: string },
): Promise<Validation<SendMoneyPayload>> {
  const amount = round2(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) return { ok: false, error: "invalid_amount" };
  if (amount > MAX_SAR) return { ok: false, error: "amount_too_large" };

  const gate = membershipGate(membership, amount);
  if (gate) {
    return {
      ok: false,
      error: gate,
      detail: gate === "over_spend_limit" ? `monthly spend limit SAR ${membership?.spendLimit}` : undefined,
    };
  }

  const beneficiary = await resolveBeneficiary(userId, String(input.beneficiary ?? ""));
  if (!beneficiary) {
    return { ok: false, error: "beneficiary_not_found", detail: String(input.beneficiary ?? "") };
  }

  const account = await spendableAccount(userId);
  if (!account) return { ok: false, error: "no_account" };
  if (account.balance < amount) {
    return { ok: false, error: "insufficient_funds", detail: `balance SAR ${round2(account.balance)}` };
  }

  const name = beneficiary.name as { en?: string; ar?: string } | null;
  const bank = beneficiary.bank as { en?: string; ar?: string } | null;
  return {
    ok: true,
    payload: {
      kind: "send_money",
      beneficiaryExtId: beneficiary.extId,
      beneficiaryName: loc(name?.en ?? "Beneficiary", name?.ar ?? "مستفيد"),
      bank: loc(bank?.en ?? "", bank?.ar ?? ""),
      ibanLast4: beneficiary.iban.slice(-4),
      amount,
      note: input.note?.trim() ? input.note.trim().slice(0, 120) : undefined,
      balanceBefore: round2(account.balance),
    },
  };
}

/** Resolve a catalog stock by symbol (exact, case-insensitive) or English/Arabic name. */
export function resolveStock(ref: string) {
  const needle = ref.trim();
  if (!needle) return undefined;
  const lower = needle.toLowerCase();
  return (
    stockBySymbol(needle.toUpperCase()) ??
    stocks.find((s) => s.name.en.toLowerCase() === lower || s.name.ar === needle) ??
    (needle.length >= 2
      ? stocks.find(
          (s) => s.name.en.toLowerCase().includes(lower) || s.name.ar.includes(needle),
        )
      : undefined)
  );
}

export async function validateTrade(
  userId: string,
  side: "buy_stock" | "sell_stock",
  input: { symbol: string; units: number },
): Promise<Validation<TradePayload>> {
  const stock = resolveStock(String(input.symbol ?? ""));
  if (!stock) return { ok: false, error: "unknown_symbol", detail: String(input.symbol ?? "") };

  const units = Number(input.units);
  if (!Number.isFinite(units) || units <= 0) return { ok: false, error: "invalid_units" };

  const row = await prisma.marketPortfolio.findUnique({ where: { userId } });
  const cash = row?.cash ?? 92650.75; // mirrors GET /api/markets/portfolio default
  const positions =
    (row?.positions as Record<string, { units: number; avgCost: number }> | null) ?? {};
  const held = positions[stock.symbol]?.units ?? 0;
  const totalSar = round2(tradeCostSar(stock.market, units, stock.price));

  // Sufficiency first — "you don't hold that many" beats the generic size cap.
  if (side === "sell_stock" && held < units) {
    return { ok: false, error: "insufficient_units", detail: `${held} units of ${stock.symbol} held` };
  }
  if (totalSar > MAX_SAR) return { ok: false, error: "amount_too_large" };
  if (side === "buy_stock" && totalSar > cash) {
    return { ok: false, error: "insufficient_cash", detail: `cash SAR ${round2(cash)}` };
  }

  return {
    ok: true,
    payload: {
      kind: side,
      symbol: stock.symbol,
      name: stock.name,
      market: stock.market,
      units,
      price: stock.price,
      currency: stock.market === "us" ? "USD" : "SAR",
      totalSar,
      cashBefore: round2(cash),
      unitsBefore: held,
    },
  };
}

/**
 * Settle a confirmed action atomically, re-checking funds/units inside the
 * transaction. Returns the result payload for the chat card.
 */
export async function executeAction(
  userId: string,
  payload: ActionPayload,
): Promise<ExecutionResult> {
  if (payload.kind === "send_money") return executeSendMoney(userId, payload);
  return executeTrade(userId, payload);
}

async function executeSendMoney(
  userId: string,
  p: SendMoneyPayload,
): Promise<ExecutionResult> {
  return prisma.$transaction(async (tx) => {
    const account = await spendableAccount(userId, tx);
    if (!account) return { ok: false as const, error: "no_account" as const };
    if (account.balance < p.amount) {
      return {
        ok: false as const,
        error: "insufficient_funds" as const,
        detail: `balance SAR ${round2(account.balance)}`,
      };
    }

    const now = new Date();
    const extId = `tx_ai_send_${now.getTime()}`;
    const updated = await tx.financeAccount.update({
      where: { id: account.id },
      data: { balance: { decrement: p.amount } },
    });
    await tx.transaction.create({
      data: {
        userId,
        extId,
        merchant: p.beneficiaryName,
        note: loc("Sent via naqd AI · Simulated", "أُرسلت عبر مساعد نقد · محاكاة"),
        category: "transfers",
        type: "transfer",
        status: "completed",
        method: "transfer",
        amount: -p.amount,
        date: now,
      },
    });

    return {
      ok: true as const,
      result: {
        newBalance: round2(updated.balance),
        accountNumber: updated.number,
        transactionExtId: extId,
      },
    };
  });
}

async function executeTrade(userId: string, p: TradePayload): Promise<ExecutionResult> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.marketPortfolio.findUnique({ where: { userId } });
    const cash = row?.cash ?? 92650.75;
    const positions =
      (row?.positions as Record<string, { units: number; avgCost: number }> | null) ?? {};
    const watchlist = (row?.watchlist as string[] | null) ?? [];
    const orders = (row?.orders as unknown[] | null) ?? [];

    const cost = round2(tradeCostSar(p.market, p.units, p.price));
    const prev = positions[p.symbol];
    let newCash: number;
    let unitsAfter: number;

    // Mirrors the client reducer in src/features/markets/store.tsx exactly.
    if (p.kind === "buy_stock") {
      if (cost > cash) {
        return {
          ok: false as const,
          error: "insufficient_cash" as const,
          detail: `cash SAR ${round2(cash)}`,
        };
      }
      unitsAfter = (prev?.units ?? 0) + p.units;
      const avgCost = prev
        ? (prev.avgCost * prev.units + p.price * p.units) / unitsAfter
        : p.price;
      positions[p.symbol] = { units: unitsAfter, avgCost };
      newCash = cash - cost;
    } else {
      if (!prev || prev.units < p.units) {
        return {
          ok: false as const,
          error: "insufficient_units" as const,
          detail: `${prev?.units ?? 0} units of ${p.symbol} held`,
        };
      }
      unitsAfter = prev.units - p.units;
      if (unitsAfter <= 0) delete positions[p.symbol];
      else positions[p.symbol] = { units: unitsAfter, avgCost: prev.avgCost };
      newCash = cash + cost;
    }

    const ts = Date.now();
    const newOrders = [
      { id: `o${ts}`, symbol: p.symbol, side: p.kind === "buy_stock" ? "buy" : "sell", units: p.units, price: p.price, ts },
      ...orders,
    ].slice(0, 40);

    await tx.marketPortfolio.upsert({
      where: { userId },
      create: {
        userId,
        cash: round2(newCash),
        positions: positions as Prisma.InputJsonValue,
        watchlist: watchlist as Prisma.InputJsonValue,
        orders: newOrders as Prisma.InputJsonValue,
      },
      update: {
        cash: round2(newCash),
        positions: positions as Prisma.InputJsonValue,
        orders: newOrders as Prisma.InputJsonValue,
      },
    });

    return {
      ok: true as const,
      result: { newCash: round2(newCash), unitsAfter, totalSar: cost, orderId: `o${ts}` },
    };
  });
}
