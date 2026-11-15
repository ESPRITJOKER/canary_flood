import { ArrowUpRight, Sparkles } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, Logo, Pill, SectionLabel, cx } from "../components/ui";
import { useLang } from "../i18n/use-lang";
import { useAssistant } from "../lib/assistant-context";
import { useFloodData } from "../lib/data-provider";
import { latestPass, passCount } from "../lib/data";
import { formatDate, formatKm2, formatMm } from "../lib/format";
import { NAV_ITEMS } from "./nav";
import { LangSwitch } from "./LangSwitch";

export function SidePanel() {
  const { t } = useTranslation();
  const lang = useLang();
  const { stats } = useFloodData();
  const { openWith } = useAssistant();
  if (!stats) return null;

  const latest = latestPass(stats);

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[380px] flex-col border-r border-line bg-surface-container-lowest lg:flex">
      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <Logo size={44} />
        <div className="leading-tight">
          <div className="text-headline-md font-bold tracking-tight text-primary-container">
            {t("app.name")}
          </div>
          <div className="text-label-sm uppercase tracking-[0.12em] text-secondary">
            {t("app.team")}
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 px-3" aria-label={t("app.name")}>
        {NAV_ITEMS.map(({ path, labelKey, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              cx(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-body-sm font-medium transition-colors",
                isActive
                  ? "bg-surface-container text-primary-container"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cx("h-[18px] w-[18px]", isActive ? "text-secondary" : "text-outline")}
                  aria-hidden
                />
                <span className={cx(isActive && "font-semibold")}>{t(labelKey)}</span>
                {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pt-6">
        <Card className="flex flex-col gap-3 bg-surface-container-low">
          <div className="flex items-center justify-between">
            <SectionLabel>{t("common.pass")}</SectionLabel>
            <Pill tone="safe" icon={<span className="h-1.5 w-1.5 rounded-full bg-safe-text" />}>
              {passCount(stats)}/{passCount(stats)}
            </Pill>
          </div>
          <div>
            <div className="text-headline-sm font-bold text-primary-container">
              {formatDate(latest.date, lang)}
            </div>
            <div className="text-label-sm text-on-surface-variant">{t("map.track")}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <SectionLabel>{t("map.floodedArea")}</SectionLabel>
              <div className="text-headline-md font-bold tabular-nums text-primary-container">
                {formatKm2(latest.flooded_km2, lang)}
              </div>
            </div>
            <div>
              <SectionLabel>{t("map.rain3d")}</SectionLabel>
              <div className="text-headline-md font-bold tabular-nums text-secondary">
                {formatMm(latest.rain_prev3d_mm, lang)}
              </div>
            </div>
          </div>
          <NavLink
            to="/"
            className="flex items-center justify-between rounded-lg bg-surface-container-lowest px-3 py-2 text-label-lg text-primary-container transition-colors hover:bg-surface-container"
          >
            {t("nav.map")}
            <ArrowUpRight className="h-4 w-4 text-secondary" aria-hidden />
          </NavLink>
        </Card>
      </div>

      <div className="mt-auto flex flex-col gap-3 px-4 pb-6">
        <button
          type="button"
          onClick={() => openWith()}
          className="flex min-h-[48px] items-center gap-3 rounded-xl bg-primary-container px-4 text-left text-label-lg text-on-primary shadow-card transition-colors hover:bg-secondary"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-tertiary-container text-tertiary-fixed">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-semibold">{t("assistant.open")}</span>
            <span className="block text-[11px] font-normal text-primary-fixed-dim">
              {t("assistant.disclaimer")}
            </span>
          </span>
        </button>

        <div className="flex items-center justify-between px-1">
          <span className="text-label-sm text-on-surface-variant">{t("common.language")}</span>
          <LangSwitch />
        </div>

        <p className="px-1 text-[11px] leading-snug text-outline">
          {t("app.pitch")}
        </p>
      </div>
    </aside>
  );
}
