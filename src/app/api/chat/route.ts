import { systemPrompt } from "./financial-context";
import { scriptedReply } from "./scripted";
import { auth } from "@/auth";
import { getFinanceContext } from "@/server/finance/get-finance-context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMessage = { role: "user" | "assistant"; content: string };

const encoder = new TextEncoder();
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-3.5-flash";
const DEFAULT_FALLBACK_MODEL = "openai/gpt-4o-mini";

/** Stream a fixed string back word-by-word for a natural typing effect. */
function streamScripted(text: string, note?: string): Response {
  const stream = new ReadableStream({
    async start(controller) {
      if (note) controller.enqueue(encoder.encode(`\0${note}\0`));
      const tokens = text.split(/(\s+)/);
      for (const tok of tokens) {
        controller.enqueue(encoder.encode(tok));
        await new Promise((r) => setTimeout(r, 16));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}

async function streamScriptedFallback(
  controller: ReadableStreamDefaultController<Uint8Array>,
  lastUser: string,
  locale: "en" | "ar",
) {
  const fallback = scriptedReply(lastUser, locale);
  const tokens = fallback.split(/(\s+)/);
  for (const tok of tokens) {
    controller.enqueue(encoder.encode(tok));
    await new Promise((r) => setTimeout(r, 16));
  }
  controller.close();
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
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  locale: "en" | "ar",
  system: string,
) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: openRouterHeaders(apiKey),
    body: JSON.stringify({
      model,
      max_tokens: 700,
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

  const finance = await getFinanceContext(session.user.id);
  if (!finance) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { messages?: ChatMessage[]; locale?: string };
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

  const apiKey = process.env.OPENROUTER_API_KEY;

  // No key -> curated, fully-offline demo response.
  if (!apiKey) {
    return streamScripted(scriptedReply(lastUser, locale));
  }

  const primaryModel = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const fallbackModel = process.env.OPENROUTER_FALLBACK_MODEL || DEFAULT_FALLBACK_MODEL;
  const system = systemPrompt(locale, finance);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamOpenRouterModel(controller, apiKey, primaryModel, messages, locale, system);
        controller.close();
      } catch {
        try {
          await streamOpenRouterModel(controller, apiKey, fallbackModel, messages, locale, system);
          controller.close();
        } catch {
          // Both models failed -> seamless fallback to the scripted reply.
          await streamScriptedFallback(controller, lastUser, locale);
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
