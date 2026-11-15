/**
 * Typed data loader for the FloodSight data contract (section 12.4).
 *
 * Every screen imports these types, so the front end compiles against the same
 * shape that notebook 02 exports into web/public/data/.
 */

export type Bilingual = { en: string; fr: string };
export type Bounds = [[number, number], [number, number]]; // [[south, west], [north, east]]

export interface PassStat {
  date: string; // YYYY-MM-DD
  flooded_km2: number;
  urban_signal_km2: number;
  tidal_mangrove_water_km2: number;
  water_threshold_db: number;
  rain_prev3d_mm: number | null;
}

export interface NeighbourhoodImpact {
  date: string;
  name: string;
  admin?: string;
  lat?: number;
  lon?: number;
  flooded_km2: number;
  place_radius_m?: number;
}

export interface Hotspot {
  id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  passes_flooded: number;
  peak_km2: number;
  cause: Bilingual;
  hint: Bilingual;
}

export interface ValidationRow {
  date: string;
  dswx_date?: string;
  iou?: number;
  note?: string;
}

export interface LimitItem {
  id: string;
  title: Bilingual;
  body: Bilingual;
}

export interface FloodStats {
  meta: {
    data_status: "sample" | "final";
    generated_at?: string;
    product?: string;
    source?: string;
    pipeline_version?: string;
    aoi?: string;
  };
  bounds: Bounds;
  params: Record<string, number | string>;
  dates: PassStat[];
  neighbourhoods: NeighbourhoodImpact[];
  hotspots?: Hotspot[];
  validation_dswx: ValidationRow[];
  limits: LimitItem[];
}

const BASE = `${import.meta.env.BASE_URL}data`.replace(/\/{2,}/g, "/");

export function assetUrl(file: string): string {
  return `${BASE}/${file}`;
}

export function layerUrl(kind: "flood" | "urban_signal", date: string): string {
  return assetUrl(`${kind}_${date}.png`);
}

export const MAP_DEFAULTS = {
  center: [4.05, 9.7] as [number, number],
  zoom: 12,
  minZoom: 9,
  maxZoom: 16,
};

/** CARTO dark basemap; the app stays usable if tiles fail (plain dark canvas). */
export const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export async function loadStats(signal?: AbortSignal): Promise<FloodStats> {
  const res = await fetch(assetUrl("stats.json"), { signal, cache: "no-cache" });
  if (!res.ok) throw new Error(`stats.json ${res.status}`);
  const data = (await res.json()) as FloodStats;
  if (!Array.isArray(data.dates) || data.dates.length === 0) {
    throw new Error("stats.json has no dates");
  }
  return data;
}

/* ---------------------------------------------------------------- helpers */

export const isSample = (stats: FloodStats) => stats.meta.data_status === "sample";

export const passCount = (stats: FloodStats) => stats.dates.length;

export function latestPass(stats: FloodStats): PassStat {
  return stats.dates[stats.dates.length - 1];
}

export function peakPass(stats: FloodStats): PassStat {
  return stats.dates.reduce((best, p) => (p.flooded_km2 > best.flooded_km2 ? p : best), stats.dates[0]);
}

export function passByDate(stats: FloodStats, date: string): PassStat | undefined {
  return stats.dates.find((p) => p.date === date);
}

export function previousPass(stats: FloodStats, date: string): PassStat | undefined {
  const i = stats.dates.findIndex((p) => p.date === date);
  return i > 0 ? stats.dates[i - 1] : undefined;
}

export function deltaFromPrevious(stats: FloodStats, date: string): number | null {
  const current = passByDate(stats, date);
  const prev = previousPass(stats, date);
  if (!current || !prev) return null;
  return round(current.flooded_km2 - prev.flooded_km2, 3);
}

export function neighbourhoodsFor(stats: FloodStats, date: string): NeighbourhoodImpact[] {
  return stats.neighbourhoods
    .filter((n) => n.date === date)
    .slice()
    .sort((a, b) => b.flooded_km2 - a.flooded_km2);
}

export function hotspotList(stats: FloodStats): Hotspot[] {
  return (stats.hotspots ?? []).slice().sort((a, b) => b.passes_flooded - a.passes_flooded);
}

export function meanFlood(stats: FloodStats): number {
  return round(stats.dates.reduce((s, p) => s + p.flooded_km2, 0) / stats.dates.length, 3);
}

export function daysBetween(a: string, b: string): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

export function largestGap(stats: FloodStats): [PassStat, PassStat] {
  let best: [PassStat, PassStat] = [stats.dates[0], stats.dates[1] ?? stats.dates[0]];
  for (let i = 1; i < stats.dates.length; i += 1) {
    const gap = daysBetween(stats.dates[i - 1].date, stats.dates[i].date);
    if (gap > daysBetween(best[0].date, best[1].date)) best = [stats.dates[i - 1], stats.dates[i]];
  }
  return best;
}

/** Frequency buckets used by the hotspot legend. */
export function frequencyBucket(passesFlooded: number): "chronic" | "frequent" | "occasional" {
  if (passesFlooded >= 8) return "chronic";
  if (passesFlooded >= 4) return "frequent";
  return "occasional";
}
