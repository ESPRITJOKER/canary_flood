import { useMemo } from "react";
import L from "leaflet";
import { CircleMarker, ImageOverlay, MapContainer, Pane, TileLayer, Tooltip, ZoomControl } from "react-leaflet";
import { useTranslation } from "react-i18next";
import {
  MAP_DEFAULTS,
  TILE_ATTRIBUTION,
  TILE_URL,
  assetUrl,
  hotspotList,
  type FloodStats,
  type Hotspot,
} from "../../lib/data";
import { cx } from "../ui";

export interface LayerState {
  flood: boolean;
  streets: boolean;
  permanent: boolean;
  hotspots: boolean;
}

interface FloodMapProps {
  stats: FloodStats;
  date: string;
  layers: LayerState;
  opacity: number;
  selectedHotspot?: string | null;
  onSelectHotspot?: (hotspot: Hotspot | null) => void;
  showZoom?: boolean;
  className?: string;
  interactive?: boolean;
}

export function FloodMap({
  stats,
  date,
  layers,
  opacity,
  selectedHotspot,
  onSelectHotspot,
  showZoom = true,
  className,
  interactive = true,
}: FloodMapProps) {
  const { t } = useTranslation();
  const hotspots = useMemo(() => hotspotList(stats), [stats]);

  return (
    <div className={cx("relative isolate overflow-hidden rounded-xl bg-[#0b1620]", className)}>
      <MapContainer
        center={MAP_DEFAULTS.center}
        zoom={MAP_DEFAULTS.zoom}
        minZoom={MAP_DEFAULTS.minZoom}
        maxZoom={MAP_DEFAULTS.maxZoom}
        zoomControl={false}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        attributionControl
        className="h-full w-full"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
        {showZoom && <ZoomControl position="topright" />}

        {layers.permanent && (
          <ImageOverlay
            url={assetUrl("permanent_water.png")}
            bounds={stats.bounds}
            opacity={0.9}
            zIndex={410}
          />
        )}

        {layers.hotspots && (
          <ImageOverlay
            url={assetUrl("hotspots.png")}
            bounds={stats.bounds}
            opacity={0.75}
            zIndex={420}
          />
        )}

        {layers.flood && (
          <ImageOverlay
            key={`flood-${date}`}
            url={assetUrl(`flood_${date}.png`)}
            bounds={stats.bounds}
            opacity={opacity}
            zIndex={430}
          />
        )}

        {layers.streets && (
          <ImageOverlay
            key={`streets-${date}`}
            url={assetUrl(`urban_signal_${date}.png`)}
            bounds={stats.bounds}
            opacity={Math.min(1, opacity + 0.1)}
            zIndex={440}
          />
        )}

        {layers.hotspots &&
          hotspots.map((hotspot) => (
            <CircleMarker
              key={hotspot.id}
              center={[hotspot.lat, hotspot.lon]}
              radius={selectedHotspot === hotspot.id ? 11 : 8}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: hotspot.passes_flooded >= 8 ? "#ef4444" : hotspot.passes_flooded >= 4 ? "#f97316" : "#47a1ff",
                fillOpacity: 0.95,
              }}
              eventHandlers={{
                click: () => onSelectHotspot?.(hotspot),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <span className="text-xs font-semibold">{hotspot.name}</span>
                <span className="ml-1 text-[11px] text-on-surface-variant">
                  {hotspot.passes_flooded}/{stats.dates.length} {t("common.passes")}
                </span>
              </Tooltip>
            </CircleMarker>
          ))}

        <Pane name="labels" style={{ zIndex: 460 }} />
      </MapContainer>
    </div>
  );
}

/** Pulsing dot icon for the map (kept as a helper for custom markers). */
export function hotspotIcon(passes: number): L.DivIcon {
  const color = passes >= 8 ? "#ef4444" : passes >= 4 ? "#f97316" : "#47a1ff";
  return L.divIcon({
    className: "",
    html: `<span class="fs-pin"><span class="fs-pin__ring" style="background:${color}"></span><span class="fs-pin__dot" style="background:${color}"></span></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}
