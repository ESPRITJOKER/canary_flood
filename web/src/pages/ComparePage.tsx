import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  Clock3,
  Flame,
  Info,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Lang } from "../i18n";
import { useLang } from "../i18n/use-lang";
import { buildReport } from "../lib/assistant";
import { useAssistant } from "../lib/assistant-context";
import { daysBetween, largestGap, peakPass, type FloodStats, type PassStat } from "../lib/data";
import { useFloodData } from "../lib/data-provider";
import { formatKm2, formatLongDate, formatMm, formatNumber } from "../lib/format";
import { BeforeAfterSlider } from "../components/map/BeforeAfterSlider";
import { Card, PageTitle, Pill, SectionLabel, cx } from "../components/ui";

export function ComparePage() {
  const { stats } = useFloodData();
  const data = stats!;
  const { t } = useTranslation();
  const lang = useLang();
  const { openWith } = useAssistant();

  const peak = useMemo(() => peakPass(data), [data]);
  const [a, setA] = useState(data.dates[0].date);
  const [b, setB] = useState(peak.date);
  const [copied, setCopied] = useState(false);

  const passA = data.dates.find((p) => p.date === a) ?? data.dates[0];
  const passB = data.dates.find((p) => p.date === b) ?? peak;
  const delta = passB.flooded_km2 - passA.flooded_km2;
  const pct = passA.flooded_km2 > 0 ? (delta / passA.flooded_km2) * 100 : null;
  const report = buildReport(data, lang, passA.date, passB.date);
  const gap = largestGap(data);

  const presets = [
    {
      id: "peak",
      icon: Flame,
      title: t("compare.seasonPeak"),
      a: data.dates[0].date,
      b: peak.date,
      note: `${formatLongDate(data.dates[0].date, lang)} → ${formatLongDate(peak.date, lang)}`,
    },
    {
      id: "gap",
      icon: Clock3,
      title: t("compare.longGap"),
      a: gap[0].date,
      b: gap[1].date,
      note: `${daysBetween(gap[0].date, gap[1].date)} ${t("compare.daysBetween")}`,
    },
    {
      id: "last",
      icon: CalendarDays,
      title: t("compare.lastPass"),
      a: data.dates[Math.max(0, data.dates.length - 3)].date,
      b: data.dates[data.dates.length - 1].date,
      note: `${formatLongDate(data.dates[data.dates.length - 1].date, lang)}`,
    },
  ];

  const copyReport = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <PageTitle
        eyebrow={
          <>
            <span className="h-2 w-2 rounded-full bg-secondary-container" />
            <span className="text-label-sm font-semibold uppercase tracking-[0.08em]">
              {t("nav.compare")}
            </span>
            <span className="text-outline-variant">•</span>
            <span className="text-label-sm text-on-surface-variant">
              {data.dates.length} {t("common.passes")}
            </span>
          </>
        }
        title={t("compare.title")}
        subtitle={t("compare.subtitle")}
      />

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <DateCard
          label={t("compare.dateA")}
          tone="info"
          value={passA}
          dates={data.dates}
          lang={lang}
          onChange={setA}
          tag={t("compare.dry")}
          icon={<CalendarDays className="h-4 w-4" aria-hidden />}
        />
        <DateCard
          label={t("compare.dateB")}
          tone="critical"
          value={passB}
          dates={data.dates}
          lang={lang}
          onChange={setB}
          tag={passB.date === peak.date ? t("compare.peak") : t("common.water")}
          icon={<Flame className="h-4 w-4" aria-hidden />}
        />
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-label-sm text-on-surface-variant">{t("compare.note")}</p>
        <button
          type="button"
          onClick={() => {
            setA(b);
            setB(a);
          }}
          className="flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full bg-surface-container-lowest px-3 text-label-sm font-semibold text-secondary shadow-card ring-1 ring-black/[0.03] transition-colors hover:bg-surface-container-low"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden />
          {t("compare.swap")}
        </button>
      </div>

      {passA.date === passB.date ? (
        <Card className="flex items-center gap-2 bg-surface-container-low text-body-sm text-on-surface-variant">
          <Info className="h-4 w-4 text-secondary" aria-hidden />
          {t("compare.sameDate")}
        </Card>
      ) : (
        <BeforeAfterSlider stats={data} before={passA.date} after={passB.date} className="h-[380px] lg:h-[480px]" />
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        <Card className="flex flex-col justify-between gap-2">
          <span className="flex items-center justify-between">
            <SectionLabel>{t("compare.netChange")}</SectionLabel>
            {delta >= 0 ? (
              <TrendingUp className="h-4 w-4 text-error" aria-hidden />
            ) : (
              <TrendingDown className="h-4 w-4 text-safe-text" aria-hidden />
            )}
          </span>
          <span className={cx("text-[1.7rem] font-bold leading-none tabular-nums", delta >= 0 ? "text-error" : "text-safe-text")}>
            {delta >= 0 ? "+" : "−"}
            {formatNumber(Math.abs(delta), lang)} <span className="text-headline-sm text-on-surface-variant">km²</span>
          </span>
          <span className="text-label-sm text-on-surface-variant">
            {formatKm2(passA.flooded_km2, lang)} → {formatKm2(passB.flooded_km2, lang)}
          </span>
        </Card>

        <Card className="flex flex-col justify-between gap-2">
          <span className="flex items-center justify-between">
            <SectionLabel>{t("compare.pctChange")}</SectionLabel>
            <Flame className="h-4 w-4 text-secondary" aria-hidden />
          </span>
          <span className="text-[1.7rem] font-bold leading-none tabular-nums text-primary-container">
            {pct === null ? "—" : `${delta >= 0 ? "+" : "−"}${formatNumber(Math.abs(pct), lang, 0)} %`}
          </span>
          <span className="text-label-sm text-on-surface-variant">
            {daysBetween(passA.date, passB.date)} {t("compare.daysBetween")}
          </span>
        </Card>

        <Card className="col-span-2 flex flex-col justify-between gap-2 sm:col-span-1">
          <span className="flex items-center justify-between">
            <SectionLabel>{t("compare.rainInWindow")}</SectionLabel>
            <span className="text-label-sm font-semibold text-secondary">GPM IMERG</span>
          </span>
          <span className="text-[1.7rem] font-bold leading-none tabular-nums text-primary-container">
            {formatMm(passB.rain_prev3d_mm, lang)}
          </span>
          <span className="text-label-sm text-on-surface-variant">
            {formatMm(passA.rain_prev3d_mm, lang)} → {formatMm(passB.rain_prev3d_mm, lang)}
          </span>
        </Card>
      </div>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <SectionLabel>{t("compare.presets")}</SectionLabel>
          <span className="text-label-sm text-secondary">NISAR 2026</span>
        </div>
        <div className="grid gap-1.5 sm:grid-cols-3">
          {presets.map((preset) => {
            const active = preset.a === a && preset.b === b;
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setA(preset.a);
                  setB(preset.b);
                }}
                aria-pressed={active}
                className={cx(
                  "flex items-start gap-2.5 rounded-xl p-3 text-left shadow-card ring-1 transition-colors",
                  active
                    ? "bg-surface-container text-primary-container ring-secondary/40"
                    : "bg-surface-container-lowest ring-black/[0.03] hover:bg-surface-container-low",
                )}
              >
                <span
                  className={cx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    active ? "bg-primary-container text-tertiary-fixed" : "bg-surface-container text-secondary",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-label-lg font-semibold text-primary-container">
                    {preset.title}
                  </span>
                  <span className="block truncate text-label-sm text-on-surface-variant">{preset.note}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <Card className="flex flex-col gap-2 bg-gradient-to-b from-white to-surface">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-secondary">
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="text-label-sm font-semibold uppercase tracking-[0.08em]">
              {t("compare.report")}
            </span>
          </span>
          <Pill tone="neutral">
            {t("report.generated", {
              a: formatLongDate(passA.date, lang),
              b: formatLongDate(passB.date, lang),
            })}
          </Pill>
        </div>
        <p className="border-l-[3px] border-tertiary-fixed-dim pl-3 text-body-sm leading-relaxed text-on-surface">
          {report}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
          <span className="text-[11px] text-on-surface-variant">{t("report.honest")}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void copyReport()}
              className="flex min-h-[36px] items-center gap-1.5 rounded-full bg-surface-container px-3 text-label-sm font-semibold text-primary-container transition-colors hover:bg-surface-container-high"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-safe-text" aria-hidden /> : <span className="text-[13px]">⧉</span>}
              {copied ? t("common.copied") : t("common.copy")}
            </button>
            <button
              type="button"
              onClick={() => openWith(t("assistant.suggest2"))}
              className="flex min-h-[36px] items-center gap-1.5 rounded-full bg-primary-container px-3 text-label-sm font-semibold text-on-primary"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {t("assistant.open")}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function DateCard({
  label,
  tone,
  value,
  dates,
  lang,
  onChange,
  tag,
  icon,
}: {
  label: string;
  tone: "info" | "critical";
  value: PassStat;
  dates: FloodStats["dates"];
  lang: Lang;
  onChange: (date: string) => void;
  tag: string;
  icon: ReactNode;
}) {
  return (
    <Card className={cx("flex flex-col gap-1.5", tone === "critical" && "ring-error/20")}>
      <div className="flex items-center justify-between">
        <span className={cx("text-label-sm font-semibold", tone === "critical" ? "text-error" : "text-outline")}>
          {label}
        </span>
        <span className={tone === "critical" ? "text-error" : "text-outline"}>{icon}</span>
      </div>
      <label className="relative">
        <select
          value={value.date}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className="w-full cursor-pointer appearance-none rounded-lg bg-surface-container-low px-2 py-1.5 text-headline-sm font-semibold text-primary-container outline-none ring-1 ring-line focus:ring-2 focus:ring-secondary"
        >
          {dates.map((pass) => (
            <option key={pass.date} value={pass.date}>
              {formatLongDate(pass.date, lang)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center justify-between gap-1.5">
        <Pill tone={tone}>{tag}</Pill>
        <span className="text-label-sm font-semibold tabular-nums text-on-surface">
          {formatKm2(value.flooded_km2, lang)}
        </span>
      </div>
    </Card>
  );
}
