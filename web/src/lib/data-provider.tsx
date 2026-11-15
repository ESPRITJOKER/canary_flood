import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { loadStats, type FloodStats } from "./data";

type Status = "loading" | "ready" | "error";

interface DataState {
  status: Status;
  stats: FloodStats | null;
  error: string | null;
  reload: () => void;
}

const DataContext = createContext<DataState | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<FloodStats | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError(null);

    loadStats(controller.signal)
      .then((data) => {
        setStats(data);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "unknown error");
        setStatus("error");
      });

    return () => controller.abort();
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const value = useMemo(() => ({ status, stats, error, reload }), [status, stats, error, reload]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useFloodData(): DataState {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useFloodData must be used inside DataProvider");
  return ctx;
}
