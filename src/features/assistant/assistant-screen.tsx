"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ArrowUp, Plus, Sparkles, Square, Copy, Check, PanelLeft, X } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { LogoMark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { useFinance } from "@/components/finance/finance-provider";
import { useMarket } from "@/features/markets/store";
import { pick } from "@/lib/localized";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "./markdown-message";
import { ConversationSidebar, type ConversationSummary } from "./conversation-sidebar";
import { ActionCard, type ActionView } from "./action-card";
import { PortfolioCard, type PortfolioCardData } from "./portfolio-card";

type Msg = {
  role: "user" | "assistant";
  content: string;
  kind?: "text" | "action" | "portfolio";
  action?: ActionView;
  card?: PortfolioCardData;
};

/** One NDJSON event from /api/chat. */
type ChatEvent =
  | { t: "text"; d: string }
  | { t: "action"; action: ActionView }
  | { t: "card"; kind: "portfolio"; data: PortfolioCardData };

/** Compact text stand-in for a card so the model keeps conversational context. */
function serializeForModel(m: Msg): string {
  if (m.kind === "action" && m.action) {
    const p = m.action.payload;
    const what =
      p.kind === "send_money"
        ? `SAR ${p.amount} to ${p.beneficiaryName.en}`
        : `${p.units} × ${p.symbol} (SAR ${p.totalSar})`;
    return `[${m.action.type} card: ${what} — status: ${m.action.status}]`;
  }
  if (m.kind === "portfolio") return "[holdings card shown]";
  return m.content;
}

export function AssistantScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("assistant");
  const { user } = useFinance();
  const router = useRouter();
  const { refresh: refreshMarket } = useMarket();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const suggestions = [
    t("suggestion1"),
    t("suggestion2"),
    t("suggestion3"),
    t("suggestion4"),
  ];

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/assistant/conversations");
      if (!res.ok) return;
      const data = (await res.json()) as { conversations: ConversationSummary[] };
      setConversations(data.conversations ?? []);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    stop();
    setMessages([]);
    setCurrentId(null);
    setDrawerOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function selectConversation(id: string) {
    if (id === currentId) {
      setDrawerOpen(false);
      return;
    }
    stop();
    setDrawerOpen(false);
    setCurrentId(id);
    setMessages([]);
    try {
      const res = await fetch(`/api/assistant/conversations/${id}`);
      if (!res.ok) return;
      const data = (await res.json()) as {
        messages: Array<{
          role: "user" | "assistant";
          content: string;
          kind?: string;
          action?: ActionView | null;
          card?: PortfolioCardData | null;
        }>;
      };
      const mapped: Msg[] = (data.messages ?? []).flatMap((m) => {
        if (m.kind === "action") {
          return m.action
            ? [{ role: m.role, content: m.content, kind: "action" as const, action: m.action }]
            : [];
        }
        if (m.kind === "portfolio") {
          return m.card
            ? [{ role: m.role, content: m.content, kind: "portfolio" as const, card: m.card }]
            : [];
        }
        return [{ role: m.role, content: m.content }];
      });
      setMessages(mapped);
    } catch {
      /* ignore */
    }
  }

  async function deleteConversation(id: string) {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (id === currentId) {
      setMessages([]);
      setCurrentId(null);
    }
    try {
      await fetch(`/api/assistant/conversations/${id}`, { method: "DELETE" });
    } catch {
      /* ignore */
    }
  }

  /** Apply one streamed NDJSON event to the message list. */
  function applyEvent(ev: ChatEvent) {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      const lastIsText = last?.role === "assistant" && (last.kind ?? "text") === "text";
      if (ev.t === "text") {
        if (lastIsText) {
          copy[copy.length - 1] = { ...last, content: last.content + ev.d };
        } else {
          copy.push({ role: "assistant", content: ev.d });
        }
        return copy;
      }
      // Card events: drop a still-empty text placeholder, append the card and
      // a fresh placeholder so follow-up text gets its own bubble.
      if (lastIsText && !last.content) copy.pop();
      if (ev.t === "action") {
        copy.push({ role: "assistant", content: "", kind: "action", action: ev.action });
      } else if (ev.t === "card" && ev.kind === "portfolio") {
        copy.push({ role: "assistant", content: "", kind: "portfolio", card: ev.data });
      }
      copy.push({ role: "assistant", content: "" });
      return copy;
    });
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // Cards are serialized to short text summaries for the model's context.
    const outgoing = next
      .map((m) => ({ role: m.role, content: serializeForModel(m) }))
      .filter((m) => m.content.trim());

    let receivedAnything = false;
    const handleLine = (line: string) => {
      if (!line.trim()) return;
      try {
        const ev = JSON.parse(line) as ChatEvent;
        receivedAnything = true;
        applyEvent(ev);
      } catch {
        /* tolerate malformed lines */
      }
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: outgoing, locale, conversationId: currentId }),
        signal: controller.signal,
      });
      const cid = res.headers.get("X-Conversation-Id");
      if (cid) setCurrentId(cid);
      if (!res.body) throw new Error("no body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) handleLine(line);
      }
      handleLine(buf);
      if (!receivedAnything) throw new Error("empty stream");
    } catch (err) {
      if ((err as Error)?.name !== "AbortError" && !receivedAnything) {
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === "assistant" && (last.kind ?? "text") === "text" && !last.content) {
            copy[copy.length - 1] = { role: "assistant", content: t("errorNote") };
          }
          return copy;
        });
      }
    } finally {
      // Remove a trailing empty text placeholder (e.g. stream ended on a card).
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && (last.kind ?? "text") === "text" && !last.content) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      setStreaming(false);
      abortRef.current = null;
      loadConversations();
      inputRef.current?.focus();
    }
  }

  /** Confirm or cancel a proposed action card. */
  async function decide(action: ActionView, decision: "confirm" | "decline") {
    if (actionBusy) return;
    setActionBusy(action.id);
    try {
      const res = await fetch(`/api/assistant/actions/${action.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = (await res.json().catch(() => null)) as {
        status?: ActionView["status"];
        result?: ActionView["result"];
      } | null;
      // 409 (already resolved) also carries the definitive status — apply it.
      if (!data?.status) return;
      const status = data.status;
      const result = data.result ?? null;
      setMessages((prev) =>
        prev.map((m) =>
          m.kind === "action" && m.action?.id === action.id
            ? { ...m, action: { ...m.action, status, result } }
            : m,
        ),
      );
      if (status === "executed") {
        // Sync the rest of the app with the server-side execution: the global
        // markets store (trades) and the server-rendered finance snapshot.
        if (action.type !== "send_money") void refreshMarket();
        router.refresh();
      }
    } catch {
      /* leave the card pending — the user can retry */
    } finally {
      setActionBusy(null);
    }
  }

  async function copy(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied((c) => (c === i ? null : c)), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  const empty = messages.length === 0;
  const lastIndex = messages.length - 1;

  return (
    <div className="relative -mx-4 -my-6 flex h-[calc(100dvh-4rem-env(safe-area-inset-top))] overflow-hidden bg-card sm:mx-0 sm:my-0 sm:h-[calc(100dvh-10rem)] sm:rounded-3xl sm:border sm:border-border sm:shadow-xs">
      {/* Sidebar — desktop */}
      <ConversationSidebar
        className="hidden w-64 shrink-0 border-e border-border lg:flex"
        conversations={conversations}
        currentId={currentId}
        onSelect={selectConversation}
        onNew={newChat}
        onDelete={deleteConversation}
      />

      {/* Chats — full-screen overlay on mobile */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex flex-col bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
            initial={{ opacity: 0, x: "-8%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "-8%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3.5 pt-[calc(0.875rem+env(safe-area-inset-top))]">
              <p className="text-base font-semibold text-foreground">{t("conversations")}</p>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label={t("close")}
                className="grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <ConversationSidebar
              className="min-h-0 flex-1"
              hideLabel
              conversations={conversations}
              currentId={currentId}
              onSelect={selectConversation}
              onNew={newChat}
              onDelete={deleteConversation}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat pane */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label={t("conversations")}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-foreground hover:bg-accent lg:hidden"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <span className="hidden h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground sm:grid">
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{t("title")}</p>
              <p className="truncate text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>
          </div>
          <button
            onClick={newChat}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("newChat")}
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-6">
          {/* Greeting */}
          <div className="flex gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong">
              <LogoMark className="h-4 w-4" />
            </span>
            <div className="max-w-[42rem] rounded-2xl rounded-ss-sm bg-surface-muted px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {t("greeting", { name: pick(user.firstName, locale) })}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t("greetingBody")}
              </p>
            </div>
          </div>

          {messages.map((m, i) => {
            const isStreamingMsg =
              streaming && i === lastIndex && m.role === "assistant" && (m.kind ?? "text") === "text";

            // AI-proposed transaction / holdings cards.
            if (m.kind === "action" || m.kind === "portfolio") {
              return (
                <div key={i} className="flex gap-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong">
                    <LogoMark className="h-4 w-4" />
                  </span>
                  {m.kind === "action" && m.action ? (
                    <ActionCard
                      action={m.action}
                      busy={actionBusy === m.action.id}
                      onDecide={(decision) => decide(m.action!, decision)}
                    />
                  ) : m.card ? (
                    <PortfolioCard data={m.card} />
                  ) : null}
                </div>
              );
            }

            if (m.role === "user") {
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="flex justify-end gap-3"
                >
                  <div className="max-w-[42rem] rounded-2xl rounded-se-sm bg-primary px-4 py-3 text-primary-foreground">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                  </div>
                  <Avatar name={pick(user.name, locale)} size="sm" className="mt-0.5" />
                </motion.div>
              );
            }
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="group flex gap-3"
              >
                <span
                  className={cn(
                    "grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong",
                    isStreamingMsg && "ring-2 ring-primary/30",
                  )}
                >
                  <LogoMark className="h-4 w-4" />
                </span>
                <div className="min-w-0 max-w-[42rem]">
                  <div className="rounded-2xl rounded-ss-sm bg-surface-muted px-4 py-3 text-sm text-foreground">
                    {m.content ? (
                      isStreamingMsg ? (
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {m.content}
                          <span className="ms-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] animate-pulse rounded-full bg-primary align-middle" />
                        </p>
                      ) : (
                        <MarkdownMessage content={m.content} />
                      )
                    ) : (
                      <ThinkingIndicator label={t("thinking")} />
                    )}
                  </div>

                  {m.content && !isStreamingMsg && (
                    <button
                      onClick={() => copy(m.content, i)}
                      className="mt-1.5 inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs text-subtle-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      {copied === i ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-positive" />
                          {t("copied")}
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          {t("copy")}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Suggestions */}
          {empty && (
            <div className="ps-11">
              <p className="mb-2 text-xs font-medium text-subtle-foreground">
                {t("suggestionsTitle")}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.05 * i, ease: [0.22, 1, 0.36, 1] }}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-surface px-3.5 py-2 text-start text-sm text-foreground transition-colors hover:border-primary hover:bg-brand-soft"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-surface/60 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:p-4 sm:pb-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 rounded-2xl border border-border bg-surface p-2 focus-within:ring-2 focus-within:ring-ring"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoGrow(e.target);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              rows={1}
              placeholder={t("placeholder")}
              className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none"
            />
            {streaming ? (
              <button
                type="button"
                onClick={stop}
                aria-label={t("stop")}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-foreground text-background transition-opacity hover:opacity-90"
              >
                <Square className="h-4 w-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label={t("send")}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:bg-primary-strong disabled:opacity-40"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            )}
          </form>
          <p className="mt-2 text-center text-xs text-subtle-foreground">{t("disclaimer")}</p>
        </div>
      </div>
    </div>
  );
}

/** Animated "thinking" state: staggered dots + a shimmering label. */
function ThinkingIndicator({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-2 py-0.5">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-primary/70"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          />
        ))}
      </span>
      <span className="animate-shimmer bg-[linear-gradient(90deg,var(--subtle-foreground)_0%,var(--foreground)_50%,var(--subtle-foreground)_100%)] bg-[length:200%_100%] bg-clip-text text-sm font-medium text-transparent">
        {label}
      </span>
    </span>
  );
}
