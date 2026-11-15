import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Eraser, Loader2, Sparkles, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLang } from "../../i18n/use-lang";
import { ask, localAnswer, type AssistantReply } from "../../lib/assistant";
import { useAssistant } from "../../lib/assistant-context";
import { useFloodData } from "../../lib/data-provider";
import { Pill, cx } from "../ui";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  source?: AssistantReply["source"];
}

let nextId = 1;

export function AssistantChat() {
  const { open, close, draft, consumeDraft } = useAssistant();
  const { stats } = useFloodData();
  const { t } = useTranslation();
  const lang = useLang();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autoSent = useRef<string | null>(null);

  const suggestions = useMemo(
    () => [t("assistant.suggest1"), t("assistant.suggest2"), t("assistant.suggest3"), t("assistant.suggest4")],
    [t],
  );

  useEffect(() => {
    if (!open) return;
    if (messages.length === 0) {
      setMessages([{ id: nextId++, role: "assistant", text: t("assistant.greeting") }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, pending, open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  const send = async (raw: string) => {
    const question = raw.trim();
    if (!question || !stats || pending) return;
    setInput("");
    setMessages((prev) => [...prev, { id: nextId++, role: "user", text: question }]);
    setPending(true);
    try {
      const reply = await ask(question, stats, lang);
      setMessages((prev) => [
        ...prev,
        { id: nextId++, role: "assistant", text: reply.text, source: reply.source },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId++,
          role: "assistant",
          text: localAnswer(question, stats, lang),
          source: "local",
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  // A page can open the assistant with a prepared question ("Ask AI about this pass").
  useEffect(() => {
    if (!open || !draft || !stats) return;
    if (autoSent.current === draft) return;
    autoSent.current = draft;
    consumeDraft();
    void send(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft, stats]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("assistant.close")}
        onClick={close}
        className="fixed inset-0 z-50 bg-primary/30 backdrop-blur-[2px] lg:bg-primary/10"
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t("assistant.title")}
        className="fixed inset-x-0 bottom-0 z-50 flex h-[82vh] flex-col overflow-hidden rounded-t-2xl bg-surface-container-lowest shadow-modal sm:inset-x-auto sm:right-6 sm:bottom-6 sm:h-[620px] sm:max-h-[calc(100vh-3rem)] sm:w-[420px] sm:rounded-2xl"
      >
        <header className="flex items-start gap-3 border-b border-line px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-tertiary-container text-tertiary-fixed">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-headline-sm font-semibold text-primary-container">
              {t("assistant.title")}
            </h2>
            <p className="truncate text-label-sm text-on-surface-variant">{t("assistant.subtitle")}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMessages([])}
              aria-label={t("assistant.clear")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            >
              <Eraser className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={close}
              aria-label={t("assistant.close")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cx("flex", message.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cx(
                  "max-w-[88%] rounded-xl px-3 py-2 text-body-sm",
                  message.role === "user"
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container text-on-surface",
                )}
              >
                <p className="whitespace-pre-line leading-relaxed">{message.text}</p>
                {message.role === "assistant" && message.source && (
                  <span className="mt-1.5 block text-[10px] uppercase tracking-wider text-on-surface-variant">
                    {message.source === "live" ? t("assistant.live") : t("assistant.local")}
                  </span>
                )}
              </div>
            </div>
          ))}

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full bg-surface-container-low px-2.5 py-1.5 text-left text-label-sm text-on-surface ring-1 ring-line transition-colors hover:bg-surface-container"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {pending && (
            <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              {t("assistant.thinking")}
            </div>
          )}
        </div>

        <footer className="border-t border-line px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <form
            className="flex items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t("assistant.placeholder")}
              aria-label={t("assistant.placeholder")}
              className="min-h-[44px] flex-1 rounded-full bg-surface-container-low px-4 text-body-sm text-on-surface outline-none ring-1 ring-line placeholder:text-outline focus:ring-2 focus:ring-secondary"
            />
            <button
              type="submit"
              disabled={!input.trim() || pending}
              aria-label={t("assistant.send")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary transition-opacity disabled:opacity-40"
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
          </form>
          <div className="mt-1.5 flex justify-center">
            <Pill tone="neutral" className="font-medium normal-case tracking-normal">
              {t("assistant.disclaimer")}
            </Pill>
          </div>
        </footer>
      </section>
    </>
  );
}
