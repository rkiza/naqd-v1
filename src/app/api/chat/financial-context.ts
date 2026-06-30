import {
  netWorth,
  totalBalance,
  accounts,
  monthlyIncome,
  monthlySpend,
  spendingByCategory,
  goals,
  card,
} from "@/data/finance";
import { portfolioValue, portfolioGainPercent, holdings } from "@/data/portfolio";
import { categories } from "@/data/categories";

/**
 * A compact, factual snapshot of the demo user's finances, injected into the
 * assistant's system prompt so answers are grounded in real numbers. Built in
 * English (the model localizes its reply to the user's language).
 */
export function buildFinancialContext(): string {
  const topCategories = spendingByCategory
    .slice(0, 5)
    .map((s) => `${categories[s.category].name.en}: SAR ${s.amount.toFixed(0)}`)
    .join(", ");

  const topHoldings = holdings
    .slice(0, 4)
    .map((h) => `${h.name.en} SAR ${h.value.toFixed(0)}`)
    .join(", ");

  const goalLines = goals
    .map(
      (g) =>
        `${g.name.en}: SAR ${g.saved.toFixed(0)} of SAR ${g.target.toFixed(0)} (${(
          (g.saved / g.target) *
          100
        ).toFixed(0)}%)`,
    )
    .join("; ");

  const coffeeSpend = 18 + 21; // demo coffee transactions this month

  return [
    `Currency: Saudi Riyal (SAR). Today: 30 June 2026.`,
    `Net worth: SAR ${netWorth.toFixed(0)}. Spendable balance (current + savings): SAR ${totalBalance.toFixed(0)}.`,
    `Accounts: ${accounts.map((a) => `${a.name.en} SAR ${a.balance.toFixed(0)}`).join(", ")}.`,
    `This month income: SAR ${monthlyIncome}. This month spending: SAR ${monthlySpend.toFixed(0)}. Savings rate: ${(((monthlyIncome - monthlySpend) / monthlyIncome) * 100).toFixed(0)}%.`,
    `Top spending categories this month: ${topCategories}.`,
    `Coffee/dining coffee spend this month: about SAR ${coffeeSpend}.`,
    `Investment portfolio value: SAR ${portfolioValue.toFixed(0)}, up ${portfolioGainPercent.toFixed(1)}% all-time. Main holdings: ${topHoldings}.`,
    `Goals: ${goalLines}.`,
    `Virtual card: naqd Virtual (mada), monthly limit SAR ${card.monthlyLimit}, spent SAR ${card.spentThisMonth.toFixed(0)} this month.`,
  ].join("\n");
}

export const SYSTEM_PROMPT = (locale: "en" | "ar") => `You are naqd AI, the money assistant inside the naqd app — a premium Saudi fintech. You help the user understand and improve their personal finances.

You have access to a live snapshot of the user's finances below. Use these exact numbers when answering. Never invent figures that contradict the snapshot.

Guidelines:
- Reply in ${locale === "ar" ? "Arabic (formal, warm Modern Standard Arabic suitable for Saudi users)" : "English"}. Always reply in this language regardless of the language of the question.
- Be concise and specific. Prefer 2–4 short sentences or a tight bulleted list.
- Format money as "SAR 1,234" (the app localizes display).
- Be encouraging and practical. When relevant, give one concrete, actionable suggestion.
- You are a demo assistant, not a licensed financial advisor; avoid definitive investment guarantees.

USER FINANCIAL SNAPSHOT:
${buildFinancialContext()}`;
