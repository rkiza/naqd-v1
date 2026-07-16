import { systemPrompt } from "./financial-context";
import { scriptedReply, detectIntent, scriptedActionText } from "./scripted";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getFinanceContext, type FinanceContext } from "@/server/finance/get-finance-context";
import { getDashboardOrg } from "@/server/company/get-company-context";
import { logActivity } from "@/server/admin/audit";
import {
  validateSendMoney,
  validateTrade,
  type ActionPayload,
  type ActionType,
} from "@/server/assistant/actions";
import { stockBySymbol, tradeCostSar } from "@/data/markets";
import { loc } from "@/lib/localized";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

/** OpenAI-format message for the OpenRouter tool loop. */
type OaMessage =
  | { role: "system" | "user" | "assistant"; content: string }
  | { role: "assistant"; content: string | null; tool_calls: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

const encoder = new TextEncoder();
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3.5-flash";
const DEFAULT_FALLBACK_MODEL = "openai/gpt-4o-mini";
/** Max model↔tool rounds per user message. */
const MAX_TOOL_ROUNDS = 4;

/**
 * Assistant tools. Read tools execute immediately server-side; action tools
 * only create a "pending" AssistantAction rendered as an in-chat confirmation
 * card — nothing moves until the user confirms.
 */
const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_stocks",
      description:
        "List the user's current stock positions (units, average cost, live value) and available trading cash. Call when the user asks what stocks they own, their positions, or their trading cash. A holdings card is shown to the user automatically.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "send_money",
      description:
        "Propose a SAR transfer to one of the user's SAVED beneficiaries (see BENEFICIARIES list). Shows a confirmation card — the transfer only executes if the user taps Confirm. Never use for recipients not in the list.",
      parameters: {
        type: "object",
        properties: {
          beneficiary: {
            type: "string",
            description: "Beneficiary id or exact name from the BENEFICIARIES list",
          },
          amount: { type: "number", description: "Amount in SAR" },
          note: { type: "string", description: "Optional short note for the transfer" },
        },
        required: ["beneficiary", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ask_recipient",
      description:
        "Show the user a tappable list of their saved beneficiaries to pick a transfer recipient. Use when the user wants to send money but hasn't named a valid saved beneficiary (or named someone not in the list) — instead of listing names in text. Pass the amount if already known.",
      parameters: {
        type: "object",
        properties: {
          amount: { type: "number", description: "Amount in SAR, if the user already gave it" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buy_stock",
      description:
        "Propose buying a stock from the naqd catalog (see STOCK CATALOG) using the user's markets cash. Shows a confirmation card — executes only after the user confirms.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Catalog symbol, e.g. 2222 or AAPL" },
          units: { type: "number", description: "Number of shares (must be > 0)" },
        },
        required: ["symbol", "units"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sell_stock",
      description:
        "Propose selling shares the user currently holds (see YOUR POSITIONS). Shows a confirmation card — executes only after the user confirms.",
      parameters: {
        type: "object",
        properties: {
          symbol: { type: "string", description: "Catalog symbol, e.g. 2222 or AAPL" },
          units: { type: "number", description: "Number of shares to sell (must be > 0)" },
        },
        required: ["symbol", "units"],
      },
    },
  },
];

/** Derive a short conversation title from the first user message. */
function deriveTitle(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "New chat";
  return t.length > 48 ? `${t.slice(0, 48).trimEnd()}…` : t;
}

function openRouterHeaders(apiKey: string): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  const siteUrl = process.env.OPENROUTER_SITE_URL;
  const appName = process.env.OPENROUTER_APP_NAME;
  if (siteUrl) headers["HTTP-Referer"] = siteUrl;
  if (appName) headers["X-Title"] = appName;
  return headers;
}

/**
 * Stream one completion round. Emits text deltas via `onText` and returns the
 * accumulated text plus any tool calls (assembled from streamed fragments).
 */
async function streamOpenRouterModel(
  onText: (tok: string) => void,
  apiKey: string,
  model: string,
  messages: OaMessage[],
): Promise<{ text: string; toolCalls: ToolCall[] }> {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openRouterHeaders(apiKey),
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.5,
      stream: true,
      tools: TOOLS,
      messages,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`OpenRouter request failed for ${model}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  const calls: Array<{ id?: string; name: string; arguments: string }> = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data: ")) continue;

      const data = trimmed.slice(6);
      if (data === "[DONE]") continue;

      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{
            delta?: {
              content?: string;
              tool_calls?: Array<{
                index?: number;
                id?: string;
                function?: { name?: string; arguments?: string };
              }>;
            };
          }>;
          error?: { message?: string };
        };
        if (parsed.error) throw new Error(parsed.error.message ?? "OpenRouter stream error");

        const delta = parsed.choices?.[0]?.delta;
        if (delta?.content) {
          text += delta.content;
          onText(delta.content);
        }
        for (const frag of delta?.tool_calls ?? []) {
          const i = frag.index ?? calls.length;
          calls[i] ??= { name: "", arguments: "" };
          if (frag.id) calls[i].id = frag.id;
          if (frag.function?.name) calls[i].name += frag.function.name;
          if (frag.function?.arguments) calls[i].arguments += frag.function.arguments;
        }
      } catch (err) {
        if (err instanceof SyntaxError) continue;
        throw err;
      }
    }
  }

  const toolCalls: ToolCall[] = calls
    .filter((c) => c && c.name)
    .map((c, i) => ({
      id: c.id ?? `call_${i}`,
      type: "function" as const,
      function: { name: c.name, arguments: c.arguments || "{}" },
    }));

  if (!text && !toolCalls.length) {
    throw new Error(`OpenRouter returned no content for ${model}`);
  }
  return { text, toolCalls };
}

/** Build the structured holdings-card data from the finance snapshot. */
function buildPortfolioCard(finance: FinanceContext) {
  const positions = Object.entries(finance.marketPortfolio.positions).map(([symbol, pos]) => {
    const stock = stockBySymbol(symbol);
    const price = stock?.price ?? pos.avgCost;
    const market = stock?.market ?? "sa";
    const valueSar = Math.round(tradeCostSar(market, pos.units, price) * 100) / 100;
    const plPercent = pos.avgCost > 0 ? ((price - pos.avgCost) / pos.avgCost) * 100 : 0;
    return {
      symbol,
      name: stock?.name ?? loc(symbol, symbol),
      market,
      currency: market === "us" ? "USD" : "SAR",
      units: pos.units,
      avgCost: pos.avgCost,
      price,
      valueSar,
      plPercent: Math.round(plPercent * 10) / 10,
    };
  });
  positions.sort((a, b) => b.valueSar - a.valueSar);
  return {
    cash: Math.round(finance.marketPortfolio.cash * 100) / 100,
    positions,
    totalSar:
      Math.round(positions.reduce((s, p) => s + p.valueSar, 0) * 100) / 100,
  };
}

/** One-line audit/telemetry description of a proposal. */
function describePayload(payload: ActionPayload): string {
  if (payload.kind === "send_money") {
    return `send_money SAR ${payload.amount.toLocaleString("en-US")} → ${payload.beneficiaryName.en} (${payload.beneficiaryExtId})`;
  }
  return `${payload.kind} ${payload.units} × ${payload.symbol} @ ${payload.currency} ${payload.price} (SAR ${payload.totalSar.toLocaleString("en-US")})`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const finance = await getFinanceContext(userId);
  if (!finance) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Resolve company role/membership from the DB (confidentiality boundary — not
  // the JWT). Owners get the employee snapshot injected; employees get none.
  const org = await getDashboardOrg(userId);

  let body: { messages?: ChatMessage[]; locale?: string; conversationId?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m) => m.role === "user" || m.role === "assistant",
  );
  const locale: "en" | "ar" = body.locale === "ar" ? "ar" : "en";
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  if (!lastUser.trim()) {
    return new Response("Bad request", { status: 400 });
  }

  // Resolve or create the conversation, then persist the incoming user message.
  let conversationId = body.conversationId;
  if (conversationId) {
    const owned = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      select: { id: true },
    });
    if (!owned) conversationId = undefined;
  }
  if (!conversationId) {
    const created = await prisma.conversation.create({
      data: { userId, title: deriveTitle(lastUser) },
      select: { id: true },
    });
    conversationId = created.id;
  }
  await prisma.chatMessage.create({
    data: { conversationId, role: "user", content: lastUser },
  });
  await logActivity({
    action: "assistant.message",
    userId,
    email: session.user.email ?? null,
    detail: lastUser.length > 80 ? `${lastUser.slice(0, 80)}…` : lastUser,
    req,
  });

  const apiKey = process.env.OPENROUTER_API_KEY;
  const primaryModel = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;
  const system = systemPrompt(locale, finance, org);
  const convoId = conversationId;
  const email = session.user.email ?? null;

  const stream = new ReadableStream({
    async start(controller) {
      /** Emit one NDJSON event line to the client. */
      const emit = (event: object) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };

      // Text accumulated since the last flush; flushed to its own ChatMessage
      // before each card so history preserves the on-screen order.
      let pendingText = "";
      // True once anything reached the client — after that we no longer retry
      // with another model (it would duplicate proposals/cards).
      let sideEffects = false;

      const onText = (tok: string) => {
        pendingText += tok;
        sideEffects = true;
        emit({ t: "text", d: tok });
      };

      const flushText = async () => {
        const text = pendingText.trim();
        pendingText = "";
        if (!text) return;
        try {
          await prisma.chatMessage.create({
            data: { conversationId: convoId, role: "assistant", content: text },
          });
        } catch {
          /* persistence best-effort */
        }
      };

      /** Emit a fixed string token-by-token (scripted / fallback path). */
      const emitScripted = async (text: string) => {
        for (const tok of text.split(/(\s+)/)) {
          if (!tok) continue;
          onText(tok);
          await new Promise((r) => setTimeout(r, 8));
        }
      };

      // Cards are queued and only surfaced AFTER the model's reply, so the chat
      // reads "I've set up a transfer…" / "Who to?" first, card underneath.
      type QueuedCard =
        | { kind: "action"; id: string; type: ActionType; payload: ActionPayload }
        | { kind: "beneficiaries"; data: Prisma.JsonObject };
      const queuedCards: QueuedCard[] = [];

      /** Create a pending action and queue its card for after the reply text. */
      const proposeAction = async (type: ActionType, payload: ActionPayload) => {
        const action = await prisma.assistantAction.create({
          data: {
            userId,
            conversationId: convoId,
            type,
            payload: payload as unknown as Prisma.InputJsonValue,
          },
        });
        sideEffects = true; // a DB row exists — never retry into a duplicate
        queuedCards.push({ kind: "action", id: action.id, type, payload });
        await logActivity({
          action: "assistant.action.propose",
          userId,
          email,
          detail: describePayload(payload),
          req,
        });
        return action.id;
      };

      /** Persist + emit the queued cards (called after the text flush). */
      const flushActionCards = async () => {
        while (queuedCards.length) {
          const card = queuedCards.shift()!;
          try {
            await prisma.chatMessage.create({
              data: {
                conversationId: convoId,
                role: "assistant",
                content: "",
                kind: card.kind === "action" ? "action" : "beneficiaries",
                payload: card.kind === "action" ? { actionId: card.id } : card.data,
              },
            });
          } catch {
            /* persistence best-effort */
          }
          if (card.kind === "action") {
            emit({ t: "action", action: { id: card.id, type: card.type, status: "pending", payload: card.payload } });
          } else {
            emit({ t: "card", kind: "beneficiaries", data: card.data });
          }
        }
      };

      /** Queue the tappable saved-beneficiaries picker (surfaced after the reply). */
      const queueBeneficiaryPicker = (amount?: number) => {
        sideEffects = true;
        queuedCards.push({
          kind: "beneficiaries",
          data: {
            amount: amount && Number.isFinite(amount) && amount > 0 ? amount : null,
            beneficiaries: finance.beneficiaries.map((b) => ({
              extId: b.id,
              name: b.name,
              bank: b.bank,
              ibanLast4: b.iban.slice(-4),
              favorite: b.favorite,
            })),
          } as unknown as Prisma.JsonObject,
        });
      };

      /** Persist + surface the holdings card; returns the data for the model. */
      const emitPortfolioCard = async () => {
        const data = buildPortfolioCard(finance);
        await prisma.chatMessage.create({
          data: {
            conversationId: convoId,
            role: "assistant",
            content: "",
            kind: "portfolio",
            payload: data as unknown as Prisma.InputJsonValue,
          },
        });
        sideEffects = true;
        emit({ t: "card", kind: "portfolio", data });
        return data;
      };

      /** Execute one tool call; returns the tool-result content for the model. */
      const handleTool = async (call: ToolCall): Promise<string> => {
        let args: Record<string, unknown>;
        try {
          args = JSON.parse(call.function.arguments || "{}") as Record<string, unknown>;
        } catch {
          return "ERROR: invalid tool arguments (not valid JSON).";
        }

        switch (call.function.name) {
          case "list_stocks": {
            const data = await emitPortfolioCard();
            return JSON.stringify({
              note: "A holdings card was just shown to the user — do not repeat the full table; add at most one short takeaway.",
              cashSar: data.cash,
              positionsValueSar: data.totalSar,
              positions: data.positions.map((p) => ({
                symbol: p.symbol,
                name: p.name.en,
                units: p.units,
                avgCost: p.avgCost,
                price: p.price,
                currency: p.currency,
                valueSar: p.valueSar,
                plPercent: p.plPercent,
              })),
            });
          }
          case "ask_recipient": {
            if (!finance.beneficiaries.length) {
              return "ERROR: no_beneficiaries — the user has no saved beneficiaries. Tell them to add one on the Payments page first.";
            }
            queueBeneficiaryPicker(Number(args.amount));
            return "A tappable list of the user's saved beneficiaries will appear right BELOW your reply. Reply with ONE short line asking them to pick a recipient (mention the amount if known). When they answer with a name, call send_money.";
          }
          case "send_money": {
            const v = await validateSendMoney(userId, org.membership, {
              beneficiary: String(args.beneficiary ?? ""),
              amount: Number(args.amount),
              note: typeof args.note === "string" ? args.note : undefined,
            });
            if (!v.ok) return `ERROR: ${v.error}${v.detail ? ` — ${v.detail}` : ""}`;
            await proposeAction("send_money", v.payload);
            return `Transfer proposal created (SAR ${v.payload.amount} to ${v.payload.beneficiaryName.en}). The confirmation card will appear right BELOW your reply. NOT executed yet — it only happens if the user taps Confirm. Reply with ONE short line introducing it, e.g. "I've set up the transfer of SAR ${v.payload.amount} to ${v.payload.beneficiaryName.en} — review the details below and confirm." Never say it's done.`;
          }
          case "buy_stock":
          case "sell_stock": {
            const v = await validateTrade(userId, call.function.name, {
              symbol: String(args.symbol ?? ""),
              units: Number(args.units),
            });
            if (!v.ok) return `ERROR: ${v.error}${v.detail ? ` — ${v.detail}` : ""}`;
            await proposeAction(call.function.name, v.payload);
            const verb = call.function.name === "buy_stock" ? "buy" : "sell";
            return `Order proposal created: ${verb} ${v.payload.units} × ${v.payload.symbol} at ${v.payload.currency} ${v.payload.price} (total SAR ${v.payload.totalSar}). The confirmation card will appear right BELOW your reply. NOT executed yet — it only happens if the user taps Confirm. Reply with ONE short line introducing it, e.g. "I've set up the order to ${verb} ${v.payload.units} ${v.payload.symbol} shares — review the details below and confirm." Never say it's done.`;
          }
          default:
            return `ERROR: unknown tool ${call.function.name}.`;
        }
      };

      /** The model ↔ tool loop for one user turn. */
      const runToolLoop = async (model: string) => {
        if (!apiKey) throw new Error("no api key");
        const work: OaMessage[] = [
          { role: "system", content: system },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ];
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const { text, toolCalls } = await streamOpenRouterModel(onText, apiKey, model, work);
          if (!toolCalls.length) return;
          work.push({ role: "assistant", content: text || null, tool_calls: toolCalls });
          await flushText(); // keep history order: text before the cards it precedes
          for (const call of toolCalls) {
            const result = await handleTool(call);
            work.push({ role: "tool", tool_call_id: call.id, content: result });
          }
        }
      };

      /** Offline / no-key path: regex intents produce the same real cards. */
      const runScripted = async () => {
        const intent = detectIntent(lastUser);
        if (intent?.kind === "list") {
          await emitPortfolioCard();
          await emitScripted(scriptedActionText("list", locale));
          return;
        }
        if (intent?.kind === "send") {
          const v = await validateSendMoney(userId, org.membership, intent);
          if (!v.ok) {
            if (v.error === "beneficiary_not_found" && finance.beneficiaries.length) {
              // Unknown name → let them pick from the saved list instead.
              await emitScripted(scriptedActionText("pickRecipient", locale));
              queueBeneficiaryPicker(intent.amount);
              return;
            }
            await emitScripted(scriptedActionText(v.error, locale, v.detail));
            return;
          }
          await emitScripted(scriptedActionText("proposal", locale));
          await proposeAction("send_money", v.payload); // card flushes after the text
          return;
        }
        if (intent?.kind === "send_pick") {
          if (!finance.beneficiaries.length) {
            await emitScripted(scriptedActionText("beneficiary_not_found", locale));
            return;
          }
          await emitScripted(scriptedActionText("pickRecipient", locale));
          queueBeneficiaryPicker(intent.amount); // card flushes after the text
          return;
        }
        if (intent?.kind === "trade") {
          const v = await validateTrade(userId, intent.side, intent);
          if (!v.ok) {
            await emitScripted(scriptedActionText(v.error, locale, v.detail));
            return;
          }
          await emitScripted(scriptedActionText("proposal", locale));
          await proposeAction(intent.side, v.payload); // card flushes after the text
          return;
        }
        await emitScripted(scriptedReply(lastUser, locale));
      };

      try {
        if (!apiKey) {
          await runScripted();
        } else {
          try {
            await runToolLoop(primaryModel);
          } catch {
            // Only retry on a clean slate — a mid-stream retry would duplicate
            // text and proposal cards the client already rendered.
            if (!sideEffects) {
              try {
                await runToolLoop(fallbackModel);
              } catch {
                if (!sideEffects) await runScripted();
              }
            }
          }
        }
      } finally {
        // Text first, cards after — the reply introduces the card underneath it.
        await flushText();
        await flushActionCards();
        try {
          await prisma.conversation.update({
            where: { id: convoId },
            data: { updatedAt: new Date() },
          });
        } catch {
          /* persistence best-effort */
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Conversation-Id": convoId,
    },
  });
}
