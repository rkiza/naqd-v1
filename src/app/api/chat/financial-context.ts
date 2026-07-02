import type { FinanceContext } from "@/server/finance/get-finance-context";
import { categories } from "@/data/categories";

export function buildFinancialContextFromData(finance: FinanceContext): string {
  const topCategories = finance.spendingByCategory
    .slice(0, 5)
    .map((s) => `${categories[s.category].name.en}: SAR ${s.amount.toFixed(0)}`)
    .join(", ");

  const topHoldings = finance.holdings
    .slice(0, 4)
    .map((h) => `${h.name.en} SAR ${h.value.toFixed(0)}`)
    .join(", ");

  const goalLines = finance.goals
    .map(
      (g) =>
        `${g.name.en}: SAR ${g.saved.toFixed(0)} of SAR ${g.target.toFixed(0)} (${(
          (g.saved / g.target) *
          100
        ).toFixed(0)}%)`,
    )
    .join("; ");

  const coffeeSpend = finance.transactions
    .filter((t) => t.category === "dining" && t.amount < 0)
    .slice(0, 2)
    .reduce((s, t) => s + Math.abs(t.amount), 0) || 39;

  return [
    `Currency: Saudi Riyal (SAR). Today: 30 June 2026.`,
    `Net worth: SAR ${finance.netWorth.toFixed(0)}. Spendable balance (current + savings): SAR ${finance.totalBalance.toFixed(0)}.`,
    `Accounts: ${finance.accounts.map((a) => `${a.name.en} SAR ${a.balance.toFixed(0)}`).join(", ")}.`,
    `This month income: SAR ${finance.monthlyIncome}. This month spending: SAR ${finance.monthlySpend.toFixed(0)}. Savings rate: ${(((finance.monthlyIncome - finance.monthlySpend) / finance.monthlyIncome) * 100).toFixed(0)}%.`,
    `Top spending categories this month: ${topCategories}.`,
    `Coffee/dining coffee spend this month: about SAR ${coffeeSpend}.`,
    `Investment portfolio value: SAR ${finance.portfolioValue.toFixed(0)}, up ${finance.portfolioGainPercent.toFixed(1)}% all-time. Main holdings: ${topHoldings}.`,
    `Goals: ${goalLines}.`,
    `Virtual card: naqd Virtual (mada), monthly limit SAR ${finance.card.monthlyLimit}, spent SAR ${finance.card.spentThisMonth.toFixed(0)} this month.`,
  ].join("\n");
}

export const systemPrompt = (locale: "en" | "ar", finance: FinanceContext) =>
  `You are naqd AI, the money assistant inside the naqd app — a premium Saudi fintech. You help the user understand and improve their personal finances.

You have access to a live snapshot of the user's finances below. Use these exact numbers when answering. Never invent figures that contradict the snapshot.

Guidelines:
- Reply in ${locale === "ar" ? "Arabic (formal, warm Modern Standard Arabic suitable for Saudi users)" : "English"}. Always reply in this language regardless of the language of the question.
- Be concise and specific. Prefer 2–4 short sentences or a tight bulleted list.
- Format money as "SAR 1,234" (the app localizes display).
- Be encouraging and practical. When relevant, give one concrete, actionable suggestion.
- You are a demo assistant, not a licensed financial advisor; avoid definitive investment guarantees.

USER FINANCIAL SNAPSHOT:
${buildFinancialContextFromData(finance)}`;
