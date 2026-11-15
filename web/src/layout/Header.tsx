import { Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Logo, cx } from "../components/ui";
import { useAssistant } from "../lib/assistant-context";
import { NAV_ITEMS } from "./nav";
import { LangSwitch } from "./LangSwitch";

export function Header() {
  const { t } = useTranslation();
  const { openWith } = useAssistant();

  return (
    <header className="fixed inset-x-0 top-0 z-40 lg:hidden">
      <div className="flex h-16 items-center justify-between gap-2 border-b border-white/40 bg-surface/85 px-4 shadow-[0_1px_8px_rgba(11,37,69,0.06)] backdrop-blur-xl">
        <div className="flex min-w-0 items-center gap-2.5">
          <Logo size={34} />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-headline-sm font-bold tracking-tight text-primary-container">
              {t("app.name")}
            </div>
            <div className="truncate text-label-sm text-on-surface-variant">{t("app.city")}</div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <LangSwitch compact />
          <button
            type="button"
            onClick={() => openWith()}
            aria-label={t("assistant.open")}
            className="flex min-h-[44px] items-center gap-1.5 rounded-full bg-primary-container px-3 text-label-sm font-semibold text-on-primary shadow-card transition-colors hover:bg-secondary"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">AI</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomTabs() {
  const { t } = useTranslation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-container-lowest/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl shadow-nav lg:hidden"
      aria-label={t("app.name")}
    >
      <div className="flex h-[68px] items-stretch justify-around px-1">
        {NAV_ITEMS.map(({ path, labelKey, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              cx(
                "flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 text-label-sm transition-colors",
                isActive
                  ? "text-secondary font-semibold"
                  : "text-on-surface-variant hover:text-on-surface",
              )
            }
          >
            <Icon className="h-[21px] w-[21px]" aria-hidden />
            <span className="truncate">{t(labelKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
