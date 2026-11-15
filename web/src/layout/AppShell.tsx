import { Suspense, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RotateCw, Satellite } from "lucide-react";
import { isSample } from "../lib/data";
import { useFloodData } from "../lib/data-provider";
import { BottomTabs, Header } from "./Header";
import { SidePanel } from "./SidePanel";
import { AssistantChat } from "../components/assistant/AssistantChat";
import { SampleBanner } from "../components/ui";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

export function AppShell() {
  const { status, stats, error, reload } = useFloodData();
  const { t } = useTranslation();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  return (
    <div className="min-h-full bg-surface">
      <Header />
      <SidePanel />

      <main className="pt-16 pb-[84px] lg:pt-0 lg:pb-0 lg:pl-[380px]">
        <div className="mx-auto w-full max-w-[1080px] px-4 py-5 lg:px-8 lg:py-8">
          {status === "loading" && <LoadingState label={t("common.loading")} />}
          {status === "error" && (
            <ErrorState message={error ?? ""} retryLabel={t("common.retry")} onRetry={reload} />
          )}
          {status === "ready" && stats && (
            <div className="flex flex-col gap-4 lg:gap-6">
              {isSample(stats) && <SampleBanner label={t("sample.badge")} text={t("sample.banner")} />}
              <RouteErrorBoundary
                key={pathname}
                label={t("common.routeError")}
                retryLabel={t("common.retry")}
              >
                <Suspense fallback={<RouteFallback label={t("common.loading")} />}>
                  <Outlet />
                </Suspense>
              </RouteErrorBoundary>
            </div>
          )}
        </div>
      </main>

      <BottomTabs />
      <AssistantChat />
    </div>
  );
}

function RouteFallback({ label }: { label: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 text-body-sm text-on-surface-variant">
      <Satellite className="h-4 w-4 animate-pulse text-secondary" aria-hidden />
      {label}
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-on-surface-variant">
      <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-surface-container-high">
        <span className="absolute inset-0 animate-ping rounded-full bg-secondary-container/30" />
        <Satellite className="h-6 w-6 text-secondary" aria-hidden />
      </div>
      <p className="text-body-sm">{label}</p>
    </div>
  );
}

function ErrorState({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto mt-10 max-w-md rounded-xl bg-surface-container-lowest p-5 text-center shadow-card">
      <p className="text-headline-sm font-semibold text-primary-container">
        Data files not found
      </p>
      <p className="mt-1 text-body-sm text-on-surface-variant">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary-container px-4 text-label-lg text-on-primary"
      >
        <RotateCw className="h-4 w-4" aria-hidden />
        {retryLabel}
      </button>
    </div>
  );
}
