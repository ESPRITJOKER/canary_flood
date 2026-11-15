import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Info,
  Map as MapIcon,
  Satellite,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Waves,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLang } from "../i18n/use-lang";
import {
  deltaFromPrevious,
  latestPass,
  passCount,
  peakPass,
  type Hotspot,
} from "../lib/data";
import { useFloodData } from "../lib/data-provider";
import { formatKm2, formatLongDate, formatMm, formatNumber, formatSignedKm2 } from "../lib/format";
import { FloodMap, type LayerState } from "../components/map/FloodMap";
import { LayerControls } from "../components/map/LayerControls";
import { PassTimeline } from "../components/map/PassTimeline";
import { Card, Metric, PageTitle, Pill, cx } from "../components/ui";
import { useAssistant } from "../lib/assistant-context";

export function MapPage() {
  const { stats } = useFloodData();
  const { t } = useTranslation();
  const lang = useLang();
  const { openWith } = useAssistant();

  const [date, setDate] = useState(() => latestPass(stats!).date);
  const [playing, setPlaying] = useState(false);
  const [opacity, setOpacity] = useState(0.85);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  const [layers, setLayers] = useState<LayerState>({
    flood: true,
    streets: false,
    permanent: true,
    hotspots: false,
  });

  const data = stats!;
  const pass = useMemo(() => data.dates.find((p) => p.date === date) ?? latestPass(data), [data, date]);
  const peak = useMemo(() => peakPass(data), [data]);
  const delta = deltaFromPrevious(data, pass.date);
  const index = data.dates.findIndex((p) => p.date === pass.date);
  const streetsEmpty = data.dates.every((p) => p.urban_signal_km2 === 0);

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => {
      setDate((current) => {
        const i = data.dates.findIndex((p) => p.date === current);
        return data.dates[(i + 1) % data.dates.length].date;
      });
    }, 1600);
    return () => clearInterval(timer);
  }, [playing, data.dates]);

  const toggleLayer = (key: keyof LayerState) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  const askAboutPass = () =>
    openWith(
      lang === "fr"
        ? `Que s'est-il passé le ${formatLongDate(pass.date, "fr")} ?`
        : `What happened on ${formatLongDate(pass.date, "en")}?`,
    );

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <PageTitle
        eyebrow={
          <>
            <Satellite className="h-4 w-4" aria-hidden />
            <span className="text-label-sm font-semibold uppercase tracking-[0.08em]">
              {t("map.status")}
            </span>
            <span className="text-outline-variant">•</span>
            <span className="text-label-sm text-on-surface-variant">{t("map.track")}</span>
          </>
        }
        title={t("map.title")}
        subtitle={t("map.subtitle")}
        right={
          <Pill tone="info" className="shrink-0">
            {index + 1} / {passCount(data)}
          </Pill>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Metric
          label={t("map.floodedArea")}
          value={formatNumber(pass.flooded_km2, lang)}
          unit="km²"
          emphasis
          foot={
            delta === null ? (
              <span>{t("common.pass")} {index + 1}</span>
            ) : (
              <>
                {delta >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-error" aria-hidden />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 text-safe-text" aria-hidden />
                )}
                <span>{formatSignedKm2(delta, lang)} {t("map.vsPrior")}</span>
              </>
            )
          }
          tone={delta !== null && delta > 0 ? "critical" : "neutral"}
        />
        <Metric
          label={t("map.peakPass")}
          value={formatNumber(peak.flooded_km2, lang)}
          unit="km²"
          foot={<span>{formatLongDate(peak.date, lang)}</span>}
        />
        <Metric
          label={t("map.rain3d")}
          value={pass.rain_prev3d_mm === null ? "—" : Math.round(pass.rain_prev3d_mm)}
          unit={pass.rain_prev3d_mm === null ? undefined : "mm"}
          foot={
            <span className="truncate">
              {pass.rain_prev3d_mm === null ? t("map.rainNone") : t("map.rain3dFoot")}
            </span>
          }
        />
        <Metric
          label={t("stats.colTidal")}
          value={formatNumber(pass.tidal_mangrove_water_km2, lang)}
          unit="km²"
          foot={<span className="truncate">JRC + WorldCover</span>}
        />
      </div>

      <PassTimeline
        dates={data.dates}
        value={pass.date}
        onChange={(next) => {
          setPlaying(false);
          setDate(next);
        }}
        playing={playing}
        onTogglePlay={() => setPlaying((p) => !p)}
        lang={lang}
        caption={`${formatLongDate(pass.date, lang)} · ${formatMm(pass.rain_prev3d_mm, lang)} · ${t("stats.colThreshold")} ${pass.water_threshold_db.toFixed(1)} dB`}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
            <MapIcon className="h-3.5 w-3.5 text-secondary" aria-hidden />
            {t("map.layers")}
          </span>
          <span className="text-label-sm text-on-surface-variant">{t("common.pass")} {index + 1}/{passCount(data)}</span>
        </div>
        <LayerControls
          layers={layers}
          onToggle={toggleLayer}
          opacity={opacity}
          onOpacity={setOpacity}
          streetsEmpty={streetsEmpty}
        />
      </div>

      <FloodMap
        stats={data}
        date={pass.date}
        layers={layers}
        opacity={opacity}
        selectedHotspot={selectedHotspot?.id ?? null}
        onSelectHotspot={(hotspot) => setSelectedHotspot(hotspot)}
        className="h-[360px] sm:h-[440px] lg:h-[520px]"
      />

      <div className="grid gap-2.5 lg:grid-cols-2">
        {selectedHotspot ? (
          <Card className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-error-container text-error">
                <Waves className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="truncate text-headline-sm font-bold text-primary">{selectedHotspot.name}</h2>
                  <Pill tone={selectedHotspot.passes_flooded >= 8 ? "critical" : "warning"}>
                    {selectedHotspot.passes_flooded}/{data.dates.length} {t("common.passes")}
                  </Pill>
                </div>
                <p className="text-body-sm font-medium text-on-surface">{selectedHotspot.district}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {selectedHotspot.cause[lang]} · {t("hotspots.peakExtent")}{" "}
                  {formatKm2(selectedHotspot.peak_km2, lang)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedHotspot(null)}
              aria-label={t("common.close")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </Card>
        ) : (
          <Card className="flex items-start gap-3 bg-surface-container-low">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
            <p className="text-body-sm text-on-surface-variant">{t("map.tidalNote")}</p>
          </Card>
        )}

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
              <MapIcon className="h-3.5 w-3.5 text-secondary" aria-hidden />
              {t("map.legend")}
            </span>
            <span className="text-label-sm text-on-surface-variant">NISAR L2 GCOV</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
            <LegendItem swatch="bg-[#001026]" title={t("map.legendPermanent")} foot={t("map.legendPermanentFoot")} />
            <LegendItem
              swatch="bg-gradient-to-r from-secondary to-secondary-container"
              title={t("map.legendFlood")}
              foot={t("map.legendFloodFoot")}
            />
            <LegendItem
              swatch="bg-error"
              title={t("map.legendStreets")}
              foot={t("common.pending")}
              dot
            />
          </div>
        </Card>
      </div>

      <button
        type="button"
        onClick={askAboutPass}
        className="flex min-h-[52px] items-center justify-between gap-3 rounded-xl bg-primary-container px-4 text-left text-on-primary shadow-card transition-colors hover:bg-secondary"
      >
        <span className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-tertiary-container text-tertiary-fixed">
            <Sparkles className="h-4 w-4" aria-hidden />
          </span>
          <span className="flex flex-col">
            <span className="text-label-lg font-semibold">{t("map.aiCta")}</span>
            <span className="text-[11px] text-primary-fixed-dim">{t("map.aiCtaFoot")}</span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4 text-tertiary-fixed" aria-hidden />
      </button>
    </div>
  );
}

function LegendItem({
  swatch,
  title,
  foot,
  dot = false,
}: {
  swatch: string;
  title: string;
  foot: string;
  dot?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-container-low p-1.5">
      <span className={cx("flex h-4 w-4 shrink-0 items-center justify-center", dot ? "rounded-full" : "rounded", swatch)}>
        {dot && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-label-sm font-semibold text-on-surface">{title}</span>
        <span className="block truncate text-[10px] text-on-surface-variant">{foot}</span>
      </span>
    </div>
  );
}

