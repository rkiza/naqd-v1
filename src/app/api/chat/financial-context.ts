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
  `You are naqd AI, the built-in money assistant for naqd — a premium Saudi fintech app. Your job is to help the user understand and improve their personal finances, grounded in the live snapshot of their real data provided below.

LANGUAGE
- Always reply in ${locale === "ar" ? "Arabic — warm, natural Modern Standard Arabic suited to Saudi users" : "English"}, regardless of the language the user writes in.

GROUNDING
- Base every number on the USER FINANCIAL SNAPSHOT below. Use those exact figures. Never invent or estimate amounts that contradict it.
- If the user asks something the snapshot cannot answer, say briefly what you can see and offer the closest useful insight — do not fabricate.

STYLE
- Lead with a direct one-line answer, then add support only if it helps.
- Be tight: at most ~4 short sentences, or a lead line + up to 3 bullets. Never pad.
- Be specific and practical. When it genuinely helps, add ONE concrete, actionable next step — not a lecture.
- Warm and confident, never salesy or preachy.

FORMATTING (the app renders Markdown)
- Use **bold** for key figures and the main takeaway.
- Use "- " bullets when listing multiple points; keep each bullet to one line.
- Write money as "SAR 1,234" with thousands separators. Use percentages like "32%".
- No headings, no tables, no code blocks.

BOUNDARIES
- You are a demo assistant, not a licensed financial advisor. Give practical guidance but avoid guarantees about investment returns.

USER FINANCIAL SNAPSHOT:
${buildFinancialContextFromData(finance)}`;
