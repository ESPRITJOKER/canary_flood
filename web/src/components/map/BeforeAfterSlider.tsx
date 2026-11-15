import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageOverlay, MapContainer, Pane, TileLayer, ZoomControl } from "react-leaflet";
import { useTranslation } from "react-i18next";
import {
  MAP_DEFAULTS,
  TILE_ATTRIBUTION,
  TILE_URL,
  assetUrl,
  type FloodStats,
} from "../../lib/data";

interface BeforeAfterSliderProps {
  stats: FloodStats;
  before: string;
  after: string;
  className?: string;
}

export function BeforeAfterSlider({ stats, before, after, className }: BeforeAfterSliderProps) {
  const { t } = useTranslation();
  const [position, setPosition] = useState(50);

  return (
    <div
      className={
        "relative isolate overflow-hidden rounded-xl bg-[#0b1620] shadow-card ring-1 ring-black/5 " +
        (className ?? "h-[400px]")
      }
    >
      <MapContainer
        center={MAP_DEFAULTS.center}
        zoom={MAP_DEFAULTS.zoom}
        minZoom={MAP_DEFAULTS.minZoom}
        maxZoom={MAP_DEFAULTS.maxZoom}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        touchZoom={false}
        doubleClickZoom={false}
        boxZoom={false}
        keyboard={false}
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        <ZoomControl position="bottomright" />
        <ImageOverlay url={assetUrl("permanent_water.png")} bounds={stats.bounds} opacity={0.85} zIndex={405} />

        <Pane name="before" style={{ zIndex: 440 }}>
          <ImageOverlay
            key={`before-${before}`}
            url={assetUrl(`flood_${before}.png`)}
            bounds={stats.bounds}
            opacity={0.95}
          />
        </Pane>

        <Pane name="after" style={{ zIndex: 450, clipPath: `inset(0 0 0 ${position}%)` }}>
          <ImageOverlay
            key={`after-${after}`}
            url={assetUrl(`flood_${after}.png`)}
            bounds={stats.bounds}
            opacity={0.95}
          />
        </Pane>
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 z-[500]">
        <div className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-label-sm font-semibold text-on-surface shadow-card backdrop-blur">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-secondary" />
          {t("compare.dateA")}
        </div>
        <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-label-sm font-semibold text-on-surface shadow-card backdrop-blur">
          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-error" />
          {t("compare.dateB")}
        </div>

        <div
          className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white/90 shadow-[0_0_12px_rgba(0,16,38,0.45)]"
          style={{ left: `${position}%` }}
        >
          <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-primary-container px-1.5 py-1.5 text-primary-fixed shadow-hud">
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-tertiary-fixed">
              {t("common.before")} / {t("common.after")}
            </span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-3 flex justify-center">
          <span className="max-w-[88%] rounded-full bg-white/85 px-3 py-1 text-center text-label-sm text-on-surface backdrop-blur">
            {t("compare.drag")}
          </span>
        </div>
      </div>

      <input
        type="range"
        min={3}
        max={97}
        step={0.5}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label={t("compare.drag")}
        className="absolute inset-0 z-[510] h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
