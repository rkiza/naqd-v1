import { systemPrompt } from "./financial-context";
import { scriptedReply } from "./scripted";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { getFinanceContext } from "@/server/finance/get-finance-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

const encoder = new TextEncoder();
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3.5-flash";
const DEFAULT_FALLBACK_MODEL = "openai/gpt-4o-mini";

/** Derive a short conversation title from the first user message. */
function deriveTitle(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t) return "New chat";
  return t.length > 48 ? `${t.slice(0, 48).trimEnd()}…` : t;
}

/** Emit a fixed string token-by-token (used for the offline / fallback path). */
async function emitText(
  controller: ReadableStreamDefaultController<Uint8Array>,
  parts: string[],
  text: string,
) {
  for (const tok of text.split(/(\s+)/)) {
    controller.enqueue(encoder.encode(tok));
    parts.push(tok);
    await new Promise((r) => setTimeout(r, 8));
  }
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

async function streamOpenRouterModel(
  controller: ReadableStreamDefaultController<Uint8Array>,
  parts: string[],
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  system: string,
) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openRouterHeaders(apiKey),
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.5,
      stream: true,
      messages: [
        { role: "system", content: system },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error(`OpenRouter request failed for ${model}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let receivedText = false;

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
          choices?: Array<{ delta?: { content?: string } }>;
          error?: { message?: string };
        };
        if (parsed.error) throw new Error(parsed.error.message ?? "OpenRouter stream error");

        const text = parsed.choices?.[0]?.delta?.content;
        if (text) {
          receivedText = true;
          controller.enqueue(encoder.encode(text));
          parts.push(text);
        }
      } catch (err) {
        if (err instanceof SyntaxError) continue;
        throw err;
      }
    }
  }

  if (!receivedText) {
    throw new Error(`OpenRouter returned no content for ${model}`);
  }
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

  const apiKey = process.env.OPENROUTER_API_KEY;
  const primaryModel = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;
  const system = systemPrompt(locale, finance);
  const convoId = conversationId;

  const parts: string[] = [];
  const stream = new ReadableStream({
    async start(controller) {
      try {
        if (!apiKey) {
          await emitText(controller, parts, scriptedReply(lastUser, locale));
        } else {
          try {
            await streamOpenRouterModel(controller, parts, apiKey, primaryModel, messages, system);
          } catch {
            try {
              await streamOpenRouterModel(controller, parts, apiKey, fallbackModel, messages, system);
            } catch {
              await emitText(controller, parts, scriptedReply(lastUser, locale));
            }
          }
        }
      } finally {
        controller.close();
        const answer = parts.join("").trim();
        if (answer) {
          try {
            await prisma.chatMessage.create({
              data: { conversationId: convoId, role: "assistant", content: answer },
            });
            await prisma.conversation.update({
              where: { id: convoId },
              data: { updatedAt: new Date() },
            });
          } catch {
            /* persistence best-effort */
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Conversation-Id": convoId,
    },
  });
}
