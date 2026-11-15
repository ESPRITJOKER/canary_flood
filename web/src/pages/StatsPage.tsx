import { useMemo, useState } from "react";
import { BarChart3, ChevronDown, Droplets, FlaskConical, Info, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useLang } from "../i18n/use-lang";
import { meanFlood, peakPass } from "../lib/data";
import { useFloodData } from "../lib/data-provider";
import { formatKm2, formatNumber, formatShortDate } from "../lib/format";
import { Card, PageTitle, Pill, SectionLabel, cx } from "../components/ui";

const CHART = {
  flood: "#0060a8",
  rain: "#47a1ff",
  threshold: "#009d8d",
  grid: "#e2e8f0",
  axis: "#64748b",
};

export function StatsPage() {
  const { stats } = useFloodData();
  const data = stats!;
  const { t } = useTranslation();
  const lang = useLang();
  const [showParams, setShowParams] = useState(false);

  const mean = meanFlood(data);
  const peak = peakPass(data);
  const low = data.dates.filter((p) => p.flooded_km2 < 0.05).length;

  const chartData = useMemo(
    () =>
      data.dates.map((p) => ({
        date: p.date,
        label: formatShortDate(p.date, lang),
        flood: p.flooded_km2,
        rain: p.rain_prev3d_mm ?? 0,
        threshold: p.water_threshold_db,
      })),
    [data.dates, lang],
  );

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <PageTitle
        eyebrow={
          <>
            <BarChart3 className="h-4 w-4" aria-hidden />
            <span className="text-label-sm font-semibold uppercase tracking-[0.08em]">
              NISAR · {data.dates.length} {t("common.passes")}
            </span>
          </>
        }
        title={t("stats.title")}
        subtitle={t("stats.subtitle")}
      />

      <div className="grid grid-cols-3 gap-2.5">
        <Card className="flex flex-col gap-1">
          <SectionLabel>{t("stats.mean")}</SectionLabel>
          <span className="text-[1.35rem] font-bold leading-none tabular-nums text-primary-container">
            {formatNumber(mean, lang)}
            <span className="ml-1 text-label-md text-on-surface-variant">km²</span>
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <SectionLabel>{t("stats.peak")}</SectionLabel>
          <span className="text-[1.35rem] font-bold leading-none tabular-nums text-error">
            {formatNumber(peak.flooded_km2, lang)}
            <span className="ml-1 text-label-md text-on-surface-variant">km²</span>
          </span>
        </Card>
        <Card className="flex flex-col gap-1">
          <SectionLabel>{t("stats.zeroPasses")}</SectionLabel>
          <span className="text-[1.35rem] font-bold leading-none tabular-nums text-primary-container">
            {low}
            <span className="ml-1 text-label-md text-on-surface-variant">/ {data.dates.length}</span>
          </span>
        </Card>
      </div>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
            <TrendingUp className="h-3.5 w-3.5 text-secondary" aria-hidden />
            {t("stats.chartFlood")}
          </span>
          <div className="flex items-center gap-3 text-label-sm text-on-surface-variant">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-secondary" /> km²
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-secondary-container" /> {t("common.rain")} (mm)
            </span>
          </div>
        </div>
        <div className="h-[230px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 6, right: 4, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: CHART.axis }}
                tickLine={false}
                axisLine={{ stroke: CHART.grid }}
                interval="preserveStartEnd"
                angle={-35}
                textAnchor="end"
                height={46}
              />
              <YAxis
                yAxisId="flood"
                tick={{ fontSize: 10, fill: CHART.axis }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <YAxis
                yAxisId="rain"
                orientation="right"
                tick={{ fontSize: 10, fill: CHART.axis }}
                tickLine={false}
                axisLine={false}
                width={34}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${CHART.grid}`,
                  fontSize: 12,
                  boxShadow: "0 10px 15px -3px rgba(11,37,69,0.08)",
                }}
                formatter={(value, name) => {
                  const numeric = Number(value);
                  if (name === "rain") return [`${formatNumber(numeric, lang, 0)} mm`, t("stats.chartRain")];
                  return [`${formatNumber(numeric, lang, 2)} km²`, t("stats.chartFlood")];
                }}
              />
              <Bar yAxisId="flood" dataKey="flood" fill={CHART.flood} radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Line
                yAxisId="rain"
                type="monotone"
                dataKey="rain"
                stroke={CHART.rain}
                strokeWidth={2}
                dot={{ r: 2.5, fill: CHART.rain }}
                activeDot={{ r: 4 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
            <Droplets className="h-3.5 w-3.5 text-tertiary-container" aria-hidden />
            {t("stats.chartThreshold")}
          </span>
          <Pill tone="info">−24 … −14 dB</Pill>
        </div>
        <div className="h-[180px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 6, right: 4, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: CHART.axis }}
                tickLine={false}
                axisLine={{ stroke: CHART.grid }}
                interval="preserveStartEnd"
                angle={-35}
                textAnchor="end"
                height={46}
              />
              <YAxis
                domain={[-25, -10]}
                tick={{ fontSize: 10, fill: CHART.axis }}
                tickLine={false}
                axisLine={false}
                width={44}
              />
              <ReferenceLine y={-14} stroke="#ba1a1a" strokeDasharray="4 4" />
              <ReferenceLine y={-24} stroke="#ba1a1a" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: `1px solid ${CHART.grid}`,
                  fontSize: 12,
                }}
                formatter={(value) => [`${formatNumber(Number(value), lang, 1)} dB`, t("stats.colThreshold")]}
              />
              <Line
                type="monotone"
                dataKey="threshold"
                stroke={CHART.threshold}
                strokeWidth={2.5}
                dot={{ r: 3, fill: CHART.threshold }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-label-sm leading-snug text-on-surface-variant">{t("stats.thresholdNote")}</p>
      </Card>

      <Card padded={false} className="overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="text-label-md font-semibold text-on-surface">{t("stats.table")}</span>
          <span className="text-label-sm text-on-surface-variant">
            {data.dates.length} {t("common.passes")}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left">
            <thead>
              <tr className="border-y border-line bg-surface-container-low text-label-sm uppercase tracking-wide text-on-surface-variant">
                <th className="px-4 py-2 font-semibold">{t("stats.colDate")}</th>
                <th className="px-2 py-2 text-right font-semibold">{t("stats.colFlood")}</th>
                <th className="px-2 py-2 text-right font-semibold">{t("stats.colStreets")}</th>
                <th className="px-2 py-2 text-right font-semibold">{t("stats.colTidal")}</th>
                <th className="px-2 py-2 text-right font-semibold">{t("stats.colThreshold")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("stats.colRain")}</th>
              </tr>
            </thead>
            <tbody className="text-body-sm tabular-nums">
              {data.dates.map((pass) => {
                const isPeak = pass.date === peak.date;
                return (
                  <tr
                    key={pass.date}
                    className={cx("border-b border-line/70 last:border-0", isPeak && "bg-error-container/25")}
                  >
                    <td className="px-4 py-2 font-medium text-on-surface">
                      {formatShortDate(pass.date, lang)}
                      {isPeak && <span className="ml-1.5 text-[10px] font-bold uppercase text-error">{t("stats.peakTag")}</span>}
                    </td>
                    <td className="px-2 py-2 text-right font-semibold text-primary-container">
                      {formatNumber(pass.flooded_km2, lang)}
                    </td>
                    <td className="px-2 py-2 text-right text-on-surface-variant">
                      {formatNumber(pass.urban_signal_km2, lang)}
                    </td>
                    <td className="px-2 py-2 text-right text-on-surface-variant">
                      {formatNumber(pass.tidal_mangrove_water_km2, lang)}
                    </td>
                    <td className="px-2 py-2 text-right text-on-surface-variant">
                      {formatNumber(pass.water_threshold_db, lang, 1)}
                    </td>
                    <td className="px-4 py-2 text-right text-secondary">
                      {pass.rain_prev3d_mm === null ? "—" : `${formatNumber(pass.rain_prev3d_mm, lang, 0)} mm`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <FlaskConical className="h-4 w-4 text-secondary" aria-hidden />
          <span className="text-label-md font-semibold text-on-surface">{t("stats.validation")}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <ValidationRow label={t("stats.validationDswx")} />
          <ValidationRow label={t("stats.validationRain")} />
        </div>
        <p className="flex items-start gap-1.5 rounded-lg bg-surface-container-low px-3 py-2 text-label-sm text-on-surface-variant">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" aria-hidden />
          {t("stats.validationPending")}
        </p>
      </Card>

      <Card padded={false}>
        <button
          type="button"
          onClick={() => setShowParams((v) => !v)}
          aria-expanded={showParams}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
        >
          <span className="flex flex-col">
            <span className="text-label-md font-semibold text-on-surface">{t("stats.params")}</span>
            <span className="text-label-sm text-on-surface-variant">{t("stats.paramsNote")}</span>
          </span>
          <ChevronDown className={cx("h-4 w-4 shrink-0 text-secondary transition-transform", showParams && "rotate-180")} aria-hidden />
        </button>
        {showParams && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line px-4 py-3 text-body-sm sm:grid-cols-3">
            {Object.entries(data.params).map(([key, value]) => (
              <div key={key} className="flex items-baseline justify-between gap-2 border-b border-line/60 py-1">
                <span className="truncate text-label-sm text-on-surface-variant">{key}</span>
                <span className="shrink-0 font-semibold tabular-nums text-on-surface">{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="text-label-sm text-on-surface-variant">
        {t("stats.firstLast")}: {formatKm2(data.dates[0].flooded_km2, lang)} →{" "}
        {formatKm2(data.dates[data.dates.length - 1].flooded_km2, lang)}
      </p>
    </div>
  );
}

function ValidationRow({ label }: { label: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-surface-container-low px-3 py-2">
      <span className="text-label-sm text-on-surface">{label}</span>
      <Pill tone="warning">{t("common.pending")}</Pill>
    </div>
  );
}
