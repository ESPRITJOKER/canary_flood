import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

interface AssistantState {
  open: boolean;
  openWith: (prompt?: string) => void;
  close: () => void;
  draft: string | null;
  consumeDraft: () => void;
}

const AssistantContext = createContext<AssistantState | null>(null);

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const value = useMemo<AssistantState>(
    () => ({
      open,
      draft,
      openWith: (prompt?: string) => {
        setDraft(prompt ?? null);
        setOpen(true);
      },
      close: () => setOpen(false),
      consumeDraft: () => setDraft(null),
    }),
    [open, draft],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantState {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used inside AssistantProvider");
  return ctx;
}
