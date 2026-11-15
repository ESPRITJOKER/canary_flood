import { Droplets, Flame, Grid3x3, Layers, Waves } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx } from "../ui";
import type { LayerState } from "./FloodMap";

interface LayerControlsProps {
  layers: LayerState;
  onToggle: (key: keyof LayerState) => void;
  opacity: number;
  onOpacity: (value: number) => void;
  streetsEmpty: boolean;
}

interface PillDef {
  key: keyof LayerState;
  label: string;
  icon: typeof Layers;
  tone?: "warn";
}

export function LayerControls({
  layers,
  onToggle,
  opacity,
  onOpacity,
  streetsEmpty,
}: LayerControlsProps) {
  const { t } = useTranslation();

  const pills: PillDef[] = [
    { key: "flood", label: t("map.layerFlood"), icon: Layers },
    { key: "streets", label: t("map.layerStreets"), icon: Grid3x3, tone: "warn" },
    { key: "hotspots", label: t("map.layerHotspots"), icon: Flame },
    { key: "permanent", label: t("map.layerPermanent"), icon: Waves },
  ];

  return (
    <div className="flex flex-col gap-2">
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto py-0.5">
        {pills.map(({ key, label, icon: Icon, tone }) => {
          const active = layers[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              aria-pressed={active}
              className={cx(
                "flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-full px-3 text-label-sm shadow-card transition-colors",
                active
                  ? "bg-primary-container font-semibold text-on-primary"
                  : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low",
              )}
            >
              <Icon
                className={cx(
                  "h-3.5 w-3.5",
                  active ? (tone === "warn" ? "text-warning-border" : "text-tertiary-fixed") : "text-secondary",
                )}
                aria-hidden
              />
              {label}
            </button>
          );
        })}
      </div>

      <label className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-3 py-2 shadow-card ring-1 ring-black/[0.03]">
        <Droplets className="h-3.5 w-3.5 text-secondary" aria-hidden />
        <span className="whitespace-nowrap text-label-sm text-on-surface-variant">
          {t("map.opacity")}
        </span>
        <input
          type="range"
          min={10}
          max={100}
          step={5}
          value={Math.round(opacity * 100)}
          onChange={(event) => onOpacity(Number(event.target.value) / 100)}
          className="fs-range flex-1"
          aria-label={t("map.opacity")}
        />
        <span className="w-9 text-right text-label-sm font-semibold tabular-nums text-primary-container">
          {Math.round(opacity * 100)}%
        </span>
      </label>

      {layers.streets && streetsEmpty && (
        <p className="rounded-lg bg-warning-container px-3 py-2 text-label-sm leading-snug text-warning-text ring-1 ring-warning-border">
          {t("map.streetsUnavailable")}
        </p>
      )}
    </div>
  );
}
