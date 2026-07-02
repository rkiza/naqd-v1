"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUp, Plus, Sparkles } from "lucide-react";
import type { Locale } from "@/i18n/routing";
import { LogoMark } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { useFinance } from "@/components/finance/finance-provider";
import { pick } from "@/lib/localized";
import { cn } from "@/lib/utils";

type Msg = { role: "user" | "assistant"; content: string };

export function AssistantScreen() {
  const locale = useLocale() as Locale;
  const t = useTranslations("assistant");
  const { user } = useFinance();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = [
    t("suggestion1"),
    t("suggestion2"),
    t("suggestion3"),
    t("suggestion4"),
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, locale }),
      });
      if (!res.body) throw new Error("no body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: t("errorNote") };
        return copy;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">{t("title")}</p>
            <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("newChat")}
          </button>
        )}
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

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end gap-3">
              <div className="max-w-[42rem] rounded-2xl rounded-se-sm bg-primary px-4 py-3 text-primary-foreground">
                <p className="text-sm leading-relaxed">{m.content}</p>
              </div>
              <Avatar name={pick(user.name, locale)} size="sm" className="mt-0.5" />
            </div>
          ) : (
            <div key={i} className="flex gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary-strong">
                <LogoMark className="h-4 w-4" />
              </span>
              <div className="max-w-[42rem] rounded-2xl rounded-ss-sm bg-surface-muted px-4 py-3">
                {m.content ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {m.content}
                  </p>
                ) : (
                  <span className="flex gap-1 py-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  </span>
                )}
              </div>
            </div>
          ),
        )}

        {/* Suggestions */}
        {empty && (
          <div className="ps-11">
            <p className="mb-2 text-xs font-medium text-subtle-foreground">
              {t("suggestionsTitle")}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface px-3.5 py-2 text-start text-sm text-foreground transition-colors hover:border-primary hover:bg-brand-soft"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-surface/60 p-3 sm:p-4">
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
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder={t("placeholder")}
            className="max-h-32 flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-subtle-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || streaming}
            aria-label={t("send")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:bg-primary-strong disabled:opacity-40"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-subtle-foreground">
          {t("disclaimer")}
        </p>
      </div>
    </div>
  );
}
