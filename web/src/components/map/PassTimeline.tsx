import { useEffect, useRef } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PassStat } from "../../lib/data";
import type { Lang } from "../../i18n";
import { formatShortDate } from "../../lib/format";
import { cx } from "../ui";

interface PassTimelineProps {
  dates: PassStat[];
  value: string;
  onChange: (date: string) => void;
  playing: boolean;
  onTogglePlay: () => void;
  lang: Lang;
  caption?: string;
}

export function PassTimeline({
  dates,
  value,
  onChange,
  playing,
  onTogglePlay,
  lang,
  caption,
}: PassTimelineProps) {
  const { t } = useTranslation();
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const index = dates.findIndex((d) => d.date === value);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [value]);

  const step = (delta: number) => {
    const next = dates[Math.min(dates.length - 1, Math.max(0, index + delta))];
    if (next) onChange(next.date);
  };

  return (
    <section
      className="flex flex-col gap-2 rounded-xl bg-surface-container-lowest p-2.5 shadow-card ring-1 ring-black/[0.03]"
      aria-label={t("map.timeline")}
    >
      <div className="flex items-center justify-between px-0.5">
        <span className="flex items-center gap-1.5 text-label-md font-semibold text-on-surface">
          <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
          {t("map.timeline")}
        </span>
        <span className="text-label-sm font-semibold text-secondary">{t("map.cycle")}</span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onTogglePlay}
          aria-label={playing ? t("map.pause") : t("map.play")}
          className={cx(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-primary shadow-card transition-colors active:scale-95",
            playing ? "bg-secondary" : "bg-primary-container",
          )}
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
        </button>

        <div className="no-scrollbar flex flex-1 items-center gap-1.5 overflow-x-auto py-0.5">
          {dates.map((pass, i) => {
            const active = pass.date === value;
            return (
              <button
                key={pass.date}
                ref={active ? activeRef : undefined}
                type="button"
                onClick={() => onChange(pass.date)}
                aria-pressed={active}
                className={cx(
                  "shrink-0 rounded-full px-3 py-1.5 text-label-sm transition-colors",
                  active
                    ? "bg-secondary font-bold text-on-secondary shadow-card"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container",
                )}
              >
                {active && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-tertiary-fixed" />}
                {formatShortDate(pass.date, lang)}
                <span className="sr-only">{` (${i + 1}/${dates.length})`}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label={t("common.before")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
          >
            <SkipBack className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label={t("common.after")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container"
          >
            <SkipForward className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-1 pt-0.5 text-label-sm">
        <span className="truncate font-semibold text-primary-container">
          {caption ?? t("map.selectedPass", { n: index + 1, total: dates.length })}
        </span>
        <span className="shrink-0 text-on-surface-variant">{dates.length} {t("common.passes")}</span>
      </div>
    </section>
  );
}
