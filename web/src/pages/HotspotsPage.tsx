import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Download, Flame, Info, Layers, MapPin, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLang } from "../i18n/use-lang";
import { frequencyBucket, hotspotList, passCount, type Hotspot } from "../lib/data";
import { useFloodData } from "../lib/data-provider";
import { formatKm2 } from "../lib/format";
import { FloodMap } from "../components/map/FloodMap";
import { Card, PageTitle, Pill, cx } from "../components/ui";

export function HotspotsPage() {
  const { stats } = useFloodData();
  const data = stats!;
  const { t } = useTranslation();
  const lang = useLang();

  const hotspots = useMemo(() => hotspotList(data), [data]);
  const total = passCount(data);
  const districts = useMemo(
    () => Array.from(new Set(hotspots.map((h) => h.district))).sort(),
    [hotspots],
  );
  const [filter, setFilter] = useState<string>("all");
  const [toast, setToast] = useState(false);

  const visible = filter === "all" ? hotspots : hotspots.filter((h) => h.district === filter);

  const exportCsv = () => {
    const header = [
      "id",
      "name",
      "district",
      "lat",
      "lon",
      "passes_flooded",
      "passes_total",
      "recurrence_pct",
      "peak_km2",
      "cause_en",
      "cause_fr",
    ];
    const rows = hotspots.map((h) => [
      h.id,
      h.name,
      h.district,
      h.lat,
      h.lon,
      h.passes_flooded,
      total,
      Math.round((h.passes_flooded / total) * 100),
      h.peak_km2,
      `"${h.cause.en.replace(/"/g, '""')}"`,
      `"${h.cause.fr.replace(/"/g, '""')}"`,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "floodsight_douala_hotspots.csv";
    link.click();
    URL.revokeObjectURL(url);
    setToast(true);
    setTimeout(() => setToast(false), 3200);
  };

  return (
    <div className="flex flex-col gap-4 lg:gap-5">
      <PageTitle
        eyebrow={
          <>
            <Flame className="h-4 w-4" aria-hidden />
            <span className="text-label-sm font-semibold uppercase tracking-[0.08em]">
              NISAR {t("hotspots.mapTitle")}
            </span>
          </>
        }
        title={t("hotspots.title")}
        subtitle={t("hotspots.subtitle", { total })}
      />

      <Card className="flex items-start gap-2.5 bg-surface-container">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-secondary" aria-hidden />
        <p className="text-body-sm text-on-surface">
          <span className="font-semibold text-primary">{t("hotspots.vulnerability")}.</span>{" "}
          {t("hotspots.vulnerabilityBody")}
        </p>
      </Card>

      <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-card ring-1 ring-black/[0.03]">
        <div className="relative">
          <FloodMap
            stats={data}
            date={data.dates[data.dates.length - 1].date}
            layers={{ flood: false, streets: false, permanent: true, hotspots: true }}
            opacity={0.9}
            showZoom={false}
            className="h-56 lg:h-72 rounded-none"
          />
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3">
            <div className="flex items-start justify-between gap-2">
              <Pill tone="critical" icon={<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-error" />}>
                {t("hotspots.mapTitle")}
              </Pill>
              <Pill tone="neutral" className="bg-white/90 backdrop-blur">
                {t("hotspots.cycles", { n: total })}
              </Pill>
            </div>
            <div className="flex items-end justify-between gap-2">
              <div className="rounded-lg bg-primary-container/85 px-2.5 py-1.5 text-on-primary backdrop-blur">
                <div className="text-[10px] uppercase tracking-wider text-primary-fixed-dim">
                  Wouri · Douala
                </div>
                <div className="text-label-lg font-bold">
                  {t("hotspots.clusters", { n: hotspots.length })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-3">
          <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
            <span>{t("hotspots.density")}</span>
            <span className="font-semibold text-primary">{t("hotspots.cycles", { n: total })}</span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-container shadow-inner">
            <div className="h-full w-1/3 bg-secondary-container" />
            <div className="h-full w-1/3 bg-secondary" />
            <div className="h-full w-1/3 bg-error" />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-label-sm text-on-surface-variant">
            <LegendDot color="bg-secondary-container" label={`1–3 ${t("common.passes")} · ${t("common.occasional")}`} />
            <LegendDot color="bg-secondary" label={`4–7 · ${t("common.frequent")}`} />
            <LegendDot color="bg-error" label={`8–${total} · ${t("common.critical")}`} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-label-lg font-bold text-primary">{t("hotspots.filter")}</span>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="text-label-sm font-semibold text-secondary hover:underline"
          >
            {t("common.showAll")}
          </button>
        </div>
        <div className="no-scrollbar -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1">
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
            {t("common.showAll")}
          </FilterPill>
          {districts.map((district) => (
            <FilterPill key={district} active={filter === district} onClick={() => setFilter(district)}>
              {district}
            </FilterPill>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {visible.length === 0 && (
          <Card className="text-body-sm text-on-surface-variant">{t("hotspots.noMatch")}</Card>
        )}
        {visible.map((hotspot) => (
          <HotspotCard
            key={hotspot.id}
            hotspot={hotspot}
            rank={hotspots.indexOf(hotspot) + 1}
            total={total}
            lang={lang}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container text-primary">
            <Layers className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="text-headline-sm font-semibold text-primary">{t("hotspots.dossier")}</div>
            <div className="text-label-sm text-on-surface-variant">{t("hotspots.exportNote")}</div>
          </div>
        </Card>
        <button
          type="button"
          onClick={exportCsv}
          className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary-container text-label-lg font-semibold text-on-primary shadow-card transition-colors hover:bg-secondary active:scale-[0.99]"
        >
          <Download className="h-4 w-4" aria-hidden />
          {t("hotspots.export")}
        </button>
        {toast && (
          <div className="animate-fade-up rounded-lg bg-surface-container-highest px-3 py-2 text-label-md font-medium text-primary">
            floodsight_douala_hotspots.csv
          </div>
        )}
      </div>
    </div>
  );
}

function HotspotCard({
  hotspot,
  rank,
  total,
  lang,
}: {
  hotspot: Hotspot;
  rank: number;
  total: number;
  lang: ReturnType<typeof useLang>;
}) {
  const { t } = useTranslation();
  const bucket = frequencyBucket(hotspot.passes_flooded);
  const bad = bucket === "chronic";

  return (
    <Card className="animate-fade-up flex flex-col gap-2.5" >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cx(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-label-sm font-bold",
              bad ? "bg-error-container text-on-error-container" : "bg-surface-container-high text-primary",
            )}
          >
            {rank}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-headline-sm font-bold text-primary">{hotspot.name}</h2>
            <span className="text-label-sm text-on-surface-variant">
              {hotspot.district} · {hotspot.hint[lang]}
            </span>
          </div>
        </div>
        <Pill tone={bad ? "critical" : bucket === "frequent" ? "warning" : "info"} className="shrink-0">
          <TrendingUp className="h-3 w-3" aria-hidden />
          {t("hotspots.datesFlooded", { n: hotspot.passes_flooded, total })}
        </Pill>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
          <span className={cx("font-semibold", bad ? "text-error" : "text-primary")}>
            {t("hotspots.recurrence", { n: Math.round((hotspot.passes_flooded / total) * 100) })}
          </span>
          <span>
            {hotspot.passes_flooded} / {total}
          </span>
        </div>
        <div className="grid h-2 w-full gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0,1fr))` }}>
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={cx(
                "h-full rounded-sm",
                i < hotspot.passes_flooded
                  ? bad
                    ? "bg-error"
                    : bucket === "frequent"
                      ? "bg-secondary"
                      : "bg-secondary-container"
                  : "bg-surface-container-highest",
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1 rounded-lg bg-surface-container-low p-2.5">
        <div className="flex items-center gap-1.5 text-body-sm text-on-surface">
          <Flame className="h-4 w-4 text-error" aria-hidden />
          <span className="font-semibold">{hotspot.cause[lang]}</span>
        </div>
        <div className="flex items-center justify-between gap-2 pt-0.5 text-label-sm text-on-surface-variant">
          <span>
            {t("hotspots.peakExtent")}:{" "}
            <strong className="text-on-surface">{formatKm2(hotspot.peak_km2, lang)}</strong>
          </span>
          <span className="flex items-center gap-1 font-medium text-secondary">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            {hotspot.lat.toFixed(3)}, {hotspot.lon.toFixed(3)}
          </span>
        </div>
      </div>
    </Card>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "flex min-h-[40px] shrink-0 items-center justify-center rounded-full px-3.5 text-label-md transition-colors",
        active
          ? "bg-primary text-on-primary shadow-card"
          : "bg-surface-container text-on-surface hover:bg-surface-container-high",
      )}
    >
      {children}
    </button>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cx("h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}
