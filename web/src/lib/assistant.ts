/**
 * Grounded assistant helpers.
 *
 * Two paths share the same numbers:
 *  - `askGemini()` posts to /api/ask (Gemini Flash + function tools), used in production.
 *  - `localAnswer()` answers deterministically from stats.json, used offline and when
 *    the free tier returns 429 or the function is not deployed.
 *
 * Neither path may state a figure that is not in stats.json.
 */
import type { Lang } from "../i18n";
import type { FloodStats, Hotspot, LimitItem, NeighbourhoodImpact, PassStat } from "./data";
import { formatDate, formatDb, formatKm2, formatMm, formatNumber } from "./format";

export interface AssistantReply {
  text: string;
  source: "live" | "local";
  tool?: string;
}

export interface AskResponse {
  answer: string;
  tool?: string;
}

/* ------------------------------------------------------------------ tools */

export function toolListDates(stats: FloodStats) {
  return stats.dates.map((p) => ({ date: p.date, flooded_km2: p.flooded_km2 }));
}

export function toolGetStats(stats: FloodStats, date: string) {
  return stats.dates.find((p) => p.date === date) ?? null;
}

export function toolCompare(stats: FloodStats, a: string, b: string) {
  const first = toolGetStats(stats, a);
  const second = toolGetStats(stats, b);
  if (!first || !second) return null;
  return {
    from: first,
    to: second,
    delta_km2: Math.round((second.flooded_km2 - first.flooded_km2) * 1000) / 1000,
  };
}

export function toolNeighbourhoods(stats: FloodStats, date: string): NeighbourhoodImpact[] {
  return stats.neighbourhoods
    .filter((n) => n.date === date)
    .sort((x, y) => y.flooded_km2 - x.flooded_km2);
}

export function toolLimits(stats: FloodStats, lang: Lang): string[] {
  return stats.limits.map((l) => `${l.title[lang]}: ${l.body[lang]}`);
}

/** Gemini function declarations — same five tools as the local engine. */
export const TOOL_DECLARATIONS = [
  {
    name: "list_dates",
    description: "List every NISAR pass that has flood data, with flooded_km2 per pass.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "get_flood_stats",
    description: "Flooded km2, possible-streets km2, tidal mangrove water and rainfall for one pass.",
    parameters: {
      type: "OBJECT",
      properties: { date: { type: "STRING", description: "Pass date, YYYY-MM-DD" } },
      required: ["date"],
    },
  },
  {
    name: "compare_dates",
    description: "Change in flooded area between two passes.",
    parameters: {
      type: "OBJECT",
      properties: {
        a: { type: "STRING", description: "Earlier pass date, YYYY-MM-DD" },
        b: { type: "STRING", description: "Later pass date, YYYY-MM-DD" },
      },
      required: ["a", "b"],
    },
  },
  {
    name: "get_neighborhoods",
    description: "Most affected OSM places within 1 km of the flood, for one pass.",
    parameters: {
      type: "OBJECT",
      properties: { date: { type: "STRING", description: "Pass date, YYYY-MM-DD" } },
      required: ["date"],
    },
  },
  {
    name: "get_limits",
    description: "What radar can and cannot see (cadence, flooded streets, tide, mangroves, forecast).",
    parameters: { type: "OBJECT", properties: {} },
  },
] as const;

export const ASSISTANT_SYSTEM_PROMPT = `You are the FloodSight assistant for Douala, Cameroon.
Rules:
1. Answer ONLY from tool results. Never invent a number, place, date or forecast.
2. If the tools return nothing relevant, reply with the localised equivalent of "No data for that in FloodSight's files."
3. FloodSight detects past flooding from NISAR radar; it never forecasts. Say so if asked to predict.
4. Reply in the user's language: English or French.
5. Be brief: 1-3 sentences, use km² and keep two decimals for small areas.
6. Mention that flooded-street and mangrove layers are pending when the user asks about them.`;

/* ------------------------------------------------------- local answering */

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const MONTHS: Record<string, string[]> = {
  "01": ["january", "janvier", "jan"],
  "02": ["february", "fevrier", "feb", "fev"],
  "03": ["march", "mars", "mar"],
  "04": ["april", "avril", "apr", "avr"],
  "05": ["may", "mai"],
  "06": ["june", "juin", "jun"],
  "07": ["july", "juillet", "jul"],
  "08": ["august", "aout", "aug"],
  "09": ["september", "septembre", "sep"],
  "10": ["october", "octobre", "oct"],
  "11": ["november", "novembre", "nov"],
  "12": ["december", "decembre", "dec"],
};

function dateTokens(date: string): string[] {
  const [y, m, d] = date.split("-");
  const day = String(Number(d));
  const months = MONTHS[m] ?? [];
  const tokens = new Set<string>([
    date,
    `${d}/${m}`,
    `${d}-${m}`,
    `${d}.${m}`,
    `${day} ${m}`,
    `${d} ${m}`,
    `${day} ${months[0]}`,
  ]);
  for (const month of months) {
    tokens.add(`${day} ${month}`);
    tokens.add(`${month} ${day}`);
    tokens.add(`${d} ${month}`);
  }
  tokens.add(`${months[0]} ${y}`);
  return [...tokens];
}

/** All passes named in the question, in question order. */
export function mentionedDates(question: string, stats: FloodStats): PassStat[] {
  const q = norm(question);
  const hits = stats.dates
    .map((p) => {
      const tokens = dateTokens(p.date);
      let best = -1;
      for (const token of tokens) {
        const i = q.indexOf(token);
        if (i >= 0) best = best === -1 ? i : Math.min(best, i);
      }
      return { pass: p, at: best };
    })
    .filter((h) => h.at >= 0)
    .sort((a, b) => a.at - b.at);
  return hits.map((h) => h.pass);
}

export function detectDate(question: string, stats: FloodStats): PassStat | null {
  return mentionedDates(question, stats)[0] ?? null;
}

function overview(stats: FloodStats, lang: Lang): string {
  const sorted = [...stats.dates].sort((a, b) => b.flooded_km2 - a.flooded_km2);
  const peak = sorted[0];
  const low = sorted[sorted.length - 1];
  const mean = stats.dates.reduce((s, p) => s + p.flooded_km2, 0) / stats.dates.length;
  const first = stats.dates[0];
  const last = stats.dates[stats.dates.length - 1];
  if (lang === "fr") {
    return `FloodSight couvre ${stats.dates.length} passages NISAR à Douala, du ${formatDate(first.date, "fr")} au ${formatDate(last.date, "fr")}. L'eau libre sur terre va de ${formatKm2(low.flooded_km2, "fr")} à ${formatKm2(peak.flooded_km2, "fr")} par passage, avec une moyenne de ${formatKm2(mean, "fr")}. Le maximum est le ${formatDate(peak.date, "fr")}. Les rivières, la marée et les mangroves sont exclues de ce total.`;
  }
  return `FloodSight covers ${stats.dates.length} NISAR passes over Douala, from ${formatDate(first.date, "en")} to ${formatDate(last.date, "en")}. Open-water flooding on land ranges from ${formatKm2(low.flooded_km2, "en")} to ${formatKm2(peak.flooded_km2, "en")} per pass, averaging ${formatKm2(mean, "en")}. The peak is ${formatDate(peak.date, "en")}. Rivers, tide and mangroves are excluded from that total.`;
}

function peakAnswer(stats: FloodStats, lang: Lang): string {
  const best = [...stats.dates].sort((a, b) => b.flooded_km2 - a.flooded_km2)[0];
  const ties = stats.dates.filter(
    (p) => p.date !== best.date && Math.abs(p.flooded_km2 - best.flooded_km2) < 1e-9,
  );
  if (lang === "fr") {
    const tie = ties.length ? ` (également ${ties.map((p) => formatDate(p.date, "fr")).join(", ")})` : "";
    return `Le passage le plus inondé est le ${formatDate(best.date, "fr")} avec ${formatKm2(best.flooded_km2, "fr")} d'eau libre sur terre${tie}. La pluie des 3 jours précédents était de ${formatMm(best.rain_prev3d_mm, "fr")}.`;
  }
  const tie = ties.length ? ` (also ${ties.map((p) => formatDate(p.date, "en")).join(", ")})` : "";
  return `The wettest pass is ${formatDate(best.date, "en")} with ${formatKm2(best.flooded_km2, "en")} of open water on land${tie}. Rain in the three days before was ${formatMm(best.rain_prev3d_mm, "en")}.`;
}

function passAnswer(p: PassStat, lang: Lang): string {
  if (lang === "fr") {
    return `Le ${formatDate(p.date, "fr")} : ${formatKm2(p.flooded_km2, "fr")} d'eau libre sur terre, ${formatKm2(p.urban_signal_km2, "fr")} de rues possiblement inondées (couche en attente de WorldCover), ${formatKm2(p.tidal_mangrove_water_km2, "fr")} d'eau de mangrove exclue, seuil ${formatDb(p.water_threshold_db, "fr")}, pluie des 3 jours précédents ${formatMm(p.rain_prev3d_mm, "fr")}.`;
  }
  return `On ${formatDate(p.date, "en")}: ${formatKm2(p.flooded_km2, "en")} of open water on land, ${formatKm2(p.urban_signal_km2, "en")} of possible flooded streets (layer pending WorldCover), ${formatKm2(p.tidal_mangrove_water_km2, "en")} of tidal mangrove water excluded, threshold ${formatDb(p.water_threshold_db, "en")}, rain in the previous three days ${formatMm(p.rain_prev3d_mm, "en")}.`;
}

function compareAnswer(a: PassStat, b: PassStat, lang: Lang): string {
  const delta = b.flooded_km2 - a.flooded_km2;
  const pct = a.flooded_km2 > 0 ? (delta / a.flooded_km2) * 100 : null;
  const sign = delta > 0 ? "+" : "−";
  const days = Math.round(
    (new Date(b.date).getTime() - new Date(a.date).getTime()) / 86_400_000,
  );
  if (lang === "fr") {
    return `Entre le ${formatDate(a.date, "fr")} (${formatKm2(a.flooded_km2, "fr")}) et le ${formatDate(b.date, "fr")} (${formatKm2(b.flooded_km2, "fr")}), la surface inondée a changé de ${sign}${formatKm2(Math.abs(delta), "fr")}${pct === null ? "" : ` (${sign}${formatNumber(Math.abs(pct), "fr", 0)} %)`}, sur ${days} jours. Pluie avant chaque passage : ${formatMm(a.rain_prev3d_mm, "fr")} puis ${formatMm(b.rain_prev3d_mm, "fr")}.`;
  }
  return `Between ${formatDate(a.date, "en")} (${formatKm2(a.flooded_km2, "en")}) and ${formatDate(b.date, "en")} (${formatKm2(b.flooded_km2, "en")}), flooded area changed by ${sign}${formatKm2(Math.abs(delta), "en")}${pct === null ? "" : ` (${sign}${formatNumber(Math.abs(pct), "en", 0)}%)`} over ${days} days. Rain before each pass: ${formatMm(a.rain_prev3d_mm, "en")} then ${formatMm(b.rain_prev3d_mm, "en")}.`;
}

function neighbourhoodAnswer(stats: FloodStats, date: string, lang: Lang): string | null {
  const places = toolNeighbourhoods(stats, date).slice(0, 3);
  if (places.length === 0) return null;
  const list = places
    .map((p) => `${p.name}${p.admin ? ` (${p.admin})` : ""} ${formatKm2(p.flooded_km2, lang)}`)
    .join(", ");
  if (lang === "fr") {
    return `Pour le ${formatDate(date, "fr")}, les lieux OSM avec le plus d'eau dans un rayon de ${formatNumber(places[0].place_radius_m ?? 1000, "fr", 0)} m sont : ${list}. Ces valeurs ne comptent que l'eau libre sur terre.`;
  }
  return `For ${formatDate(date, "en")}, the OSM places with the most flood water within ${formatNumber(places[0].place_radius_m ?? 1000, "en", 0)} m are: ${list}. These values count open water on land only.`;
}

function limitsAnswer(stats: FloodStats, lang: Lang): string {
  const picks = stats.limits.slice(0, 3).map((l) => `• ${l.title[lang]}`);
  if (lang === "fr") {
    return `FloodSight ne peut pas tout voir : ${picks.join(" ")} Il y a ${stats.limits.length} limites détaillées dans l'onglet À propos — notamment le passage tous les 12 jours, les rues inondées, la marée et l'absence de prévision.`;
  }
  return `FloodSight cannot see everything: ${picks.join(" ")} All ${stats.limits.length} limits are listed in the About tab — including the 12-day cadence, flooded streets, tide, and the fact that this is not a forecast.`;
}

function rainAnswer(stats: FloodStats, lang: Lang): string {
  const withRain = stats.dates.filter((p) => p.rain_prev3d_mm !== null);
  if (withRain.length === 0) {
    return lang === "fr"
      ? "Aucune donnée de pluie GPM IMERG n'est encore chargée, donc aucune corrélation n'est affichée."
      : "No GPM IMERG rainfall has been loaded yet, so no correlation is shown.";
  }
  const wettest = [...withRain].sort(
    (a, b) => (b.rain_prev3d_mm ?? 0) - (a.rain_prev3d_mm ?? 0),
  )[0];
  const driest = [...withRain].sort(
    (a, b) => (a.rain_prev3d_mm ?? 0) - (b.rain_prev3d_mm ?? 0),
  )[0];
  if (lang === "fr") {
    return `La pluie des 3 jours précédant chaque passage va de ${formatMm(driest.rain_prev3d_mm, "fr")} (${formatDate(driest.date, "fr")}) à ${formatMm(wettest.rain_prev3d_mm, "fr")} (${formatDate(wettest.date, "fr")}). La corrélation pluie–crue n'est pas encore calculée : les données IMERG doivent d'abord être collectées.`;
  }
  return `Rain in the three days before each pass ranges from ${formatMm(driest.rain_prev3d_mm, "en")} (${formatDate(driest.date, "en")}) to ${formatMm(wettest.rain_prev3d_mm, "en")} (${formatDate(wettest.date, "en")}). The rain–flood correlation is not computed yet: IMERG has to be collected first.`;
}

function hotspotsAnswer(stats: FloodStats, lang: Lang): string | null {
  const list: Hotspot[] = (stats.hotspots ?? []).slice().sort((a, b) => b.passes_flooded - a.passes_flooded);
  if (list.length === 0) return null;
  const top = list.slice(0, 3).map((h) => `${h.name} ${h.passes_flooded}/${stats.dates.length}`);
  if (lang === "fr") {
    return `Les points chauds les plus récurrents sont : ${top.join(", ")} passages inondés. Les causes probables sont le drainage bouché, les canaux non revêtus et le reflux de marée. Détail complet dans l'onglet Points chauds.`;
  }
  return `The most recurrent hotspots are: ${top.join(", ")} passes flooded. Likely drivers are blocked drainage, unpaved canals and tidal backflow. Full detail is in the Hotspots tab.`;
}

export function localAnswer(question: string, stats: FloodStats, lang: Lang): string {
  const q = norm(question);
  const has = (...words: string[]) => words.some((w) => q.includes(norm(w)));
  const dates = mentionedDates(question, stats);

  if (dates.length >= 2) return compareAnswer(dates[0], dates[1], lang);
  if (has("compare", "comparaison", "comparer", "difference", "différence", "versus", " vs ")) {
    if (dates.length === 1) {
      const other = dates[0].date === stats.dates[0].date ? stats.dates[stats.dates.length - 1] : stats.dates[0];
      return compareAnswer(dates[0], other, lang);
    }
    return compareAnswer(stats.dates[0], stats.dates[stats.dates.length - 1], lang);
  }

  if (has("limit", "limite", "cannot", "ne peut pas", "tide", "marée", "maree", "blind spot")) {
    return limitsAnswer(stats, lang);
  }
  if (has("hotspot", "point chaud", "points chauds", "recurr", "récurr", "reven")) {
    return hotspotsAnswer(stats, lang) ?? limitsAnswer(stats, lang);
  }
  if (has("rain", "pluie", "imerg", "mm")) {
    if (dates.length === 1) return passAnswer(dates[0], lang);
    return rainAnswer(stats, lang);
  }
  if (has("neigh", "quartier", "place", "district", "most affected", "plus touch", "impact")) {
    const date = dates[0]?.date ?? stats.dates[stats.dates.length - 1].date;
    return neighbourhoodAnswer(stats, date, lang) ?? overview(stats, lang);
  }
  if (has("peak", "maximum", "max", "highest", "pire", "worst", "wettest", "plus inond")) {
    return peakAnswer(stats, lang);
  }
  if (has("date", "passes", "passage", "calendar", "calendrier", "when", "quand", "list", "liste")) {
    if (dates.length === 0) {
      const list = stats.dates.map((p) => formatDate(p.date, lang)).join(", ");
      return lang === "fr"
        ? `Les ${stats.dates.length} passages NISAR disponibles sont : ${list}.`
        : `The ${stats.dates.length} NISAR passes available are: ${list}.`;
    }
  }
  if (dates.length === 1) return passAnswer(dates[0], lang);

  if (has("street", "rue", "urban", "batiment", "bâtiment", "worldcover")) {
    return lang === "fr"
      ? "La couche « rues possiblement inondées » dépend d'ESA WorldCover, qui n'est pas encore chargé : elle affiche zéro et ce zéro n'est pas un résultat."
      : "The 'possible flooded streets' layer depends on ESA WorldCover, which is not loaded yet: it shows zero, and that zero is not a result.";
  }

  return overview(stats, lang);
}

/** Deterministic bilingual briefing used by the Compare page and as a demo fallback. */
export function buildReport(stats: FloodStats, lang: Lang, a?: string, b?: string): string {
  const first = a ? stats.dates.find((p) => p.date === a) : stats.dates[0];
  const last = b ? stats.dates.find((p) => p.date === b) : stats.dates[stats.dates.length - 1];
  if (!first || !last) return overview(stats, lang);
  const delta = last.flooded_km2 - first.flooded_km2;
  const peak = [...stats.dates].sort((x, y) => y.flooded_km2 - x.flooded_km2)[0];
  const places = toolNeighbourhoods(stats, last.date).slice(0, 2);
  const where = places.length
    ? places.map((p) => p.name).join(lang === "fr" ? " et " : " and ")
    : null;

  if (lang === "fr") {
    const dir = delta > 0 ? "augmenté" : delta < 0 ? "baissé" : "peu changé";
    return `Entre le ${formatDate(first.date, "fr")} et le ${formatDate(last.date, "fr")}, l'eau libre sur terre a ${dir} de ${formatKm2(Math.abs(delta), "fr")} (de ${formatKm2(first.flooded_km2, "fr")} à ${formatKm2(last.flooded_km2, "fr")}). Le maximum de la saison reste le ${formatDate(peak.date, "fr")} avec ${formatKm2(peak.flooded_km2, "fr")}.${where ? ` Les lieux les plus touchés au dernier passage : ${where}.` : ""} Le radar voit à travers les nuages, mais un passage tous les 12 jours peut manquer une crue éclair : ces chiffres décrivent ce qui a été observé, pas une prévision.`;
  }
  const dir = delta > 0 ? "rose" : delta < 0 ? "fell" : "barely moved";
  return `Between ${formatDate(first.date, "en")} and ${formatDate(last.date, "en")}, open water on land ${dir} by ${formatKm2(Math.abs(delta), "en")} (from ${formatKm2(first.flooded_km2, "en")} to ${formatKm2(last.flooded_km2, "en")}). The season peak remains ${formatDate(peak.date, "en")} at ${formatKm2(peak.flooded_km2, "en")}.${where ? ` Most affected on the last pass: ${where}.` : ""} Radar sees through clouds, but a 12-day revisit can miss a flash flood: these figures describe what was observed, not a forecast.`;
}

/* ---------------------------------------------------------- live request */

const TIMEOUT_MS = 7000;

export async function askGemini(
  question: string,
  _stats: FloodStats,
  lang: Lang,
): Promise<AskResponse | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, lang }),
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!type.includes("application/json")) return null;
    const payload = (await res.json()) as AskResponse;
    if (!payload.answer) return null;
    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function ask(
  question: string,
  stats: FloodStats,
  lang: Lang,
): Promise<AssistantReply> {
  const live = await askGemini(question, stats, lang);
  if (live) return { text: live.answer, source: "live", tool: live.tool };
  return { text: localAnswer(question, stats, lang), source: "local" };
}

export function limitPreview(limit: LimitItem, lang: Lang): string {
  return `${limit.title[lang]} — ${limit.body[lang]}`;
}
