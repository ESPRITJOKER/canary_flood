/**
 * Vercel serverless function: POST /api/ask
 *
 * Gemini Flash + five function tools, all bound to public/data/stats.json.
 * The model never sees the raw JSON, only tool results, so it cannot state a
 * number that is not in the published data contract.
 *
 * Required env (set in Vercel, never in git):
 *   GEMINI_API_KEY   Google AI Studio key
 *   GEMINI_MODEL     optional, defaults to gemini-2.5-flash
 */
import { readFile } from "node:fs/promises";
import type { FunctionDeclaration } from "@google/genai";
import path from "node:path";

export const config = { runtime: "nodejs" };

type Lang = "en" | "fr";

interface PassStat {
  date: string;
  flooded_km2: number;
  urban_signal_km2: number;
  tidal_mangrove_water_km2: number;
  water_threshold_db: number;
  rain_prev3d_mm: number | null;
}

interface Hotspot {
  id: string;
  name: string;
  district: string;
  passes_flooded: number;
  peak_km2: number;
}

interface Stats {
  meta: { data_status: string; aoi?: string };
  params: Record<string, number | string>;
  dates: PassStat[];
  neighbourhoods: Array<{
    date: string;
    name: string;
    admin?: string;
    flooded_km2: number;
    place_radius_m?: number;
  }>;
  hotspots?: Hotspot[];
  limits: Array<{ title: { en: string; fr: string }; body: { en: string; fr: string } }>;
}

const SYSTEM_PROMPT = `You are the FloodSight assistant for Douala, Cameroon.
Rules:
1. Answer ONLY from tool results. Never invent a number, place, date or forecast.
2. If the tools return nothing relevant, say "No data for that in FloodSight's files." (French: "Aucune donnée correspondante dans les fichiers FloodSight.")
3. FloodSight detects past flooding from NISAR radar; it never forecasts. Say so if asked to predict.
4. Reply in the language of the question: English or French.
5. Be brief: 1-3 sentences, use km², two decimals for small areas.
6. Flooded-street and mangrove layers are pending ESA WorldCover; do not present their zeros as a result.`;

const FUNCTION_DECLARATIONS = [
  {
    name: "list_dates",
    description: "List every NISAR pass with flood data, with flooded_km2 per pass.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "get_flood_stats",
    description:
      "Flooded km2, possible-streets km2, tidal mangrove water, water threshold and rainfall for one pass.",
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
    description: "What radar can and cannot see: cadence, flooded streets, tide, mangroves, forecasting.",
    parameters: { type: "OBJECT", properties: {} },
  },
];

/* ------------------------------------------------------------- data access */

let cached: Stats | null = null;

async function loadStats(): Promise<Stats> {
  if (cached) return cached;
  const local = path.join(process.cwd(), "public", "data", "stats.json");
  try {
    cached = JSON.parse(await readFile(local, "utf8")) as Stats;
    return cached;
  } catch {
    const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
    if (!host) throw new Error("No stats.json available");
    const res = await fetch(`https://${host}/data/stats.json`);
    if (!res.ok) throw new Error(`stats.json ${res.status}`);
    cached = (await res.json()) as Stats;
    return cached;
  }
}

function runTool(name: string, args: Record<string, unknown>, stats: Stats, lang: Lang): unknown {
  switch (name) {
    case "list_dates":
      return {
        passes: stats.dates.length,
        aoi: stats.meta.aoi ?? "Douala, Cameroon",
        dates: stats.dates.map((p) => ({ date: p.date, flooded_km2: p.flooded_km2 })),
      };

    case "get_flood_stats": {
      const pass = stats.dates.find((p) => p.date === args.date);
      if (!pass) return { error: `No pass on ${String(args.date)}`, available: stats.dates.map((p) => p.date) };
      return {
        ...pass,
        note: "urban_signal_km2 is 0 only because ESA WorldCover is not loaded: not a result.",
      };
    }

    case "compare_dates": {
      const first = stats.dates.find((p) => p.date === args.a);
      const second = stats.dates.find((p) => p.date === args.b);
      if (!first || !second) {
        return { error: "Unknown date", available: stats.dates.map((p) => p.date) };
      }
      const days = Math.round(
        (new Date(second.date).getTime() - new Date(first.date).getTime()) / 86_400_000,
      );
      return {
        from: first,
        to: second,
        delta_km2: Math.round((second.flooded_km2 - first.flooded_km2) * 1000) / 1000,
        days_between: days,
      };
    }

    case "get_neighborhoods": {
      const date = String(args.date ?? stats.dates[stats.dates.length - 1].date);
      const places = stats.neighbourhoods
        .filter((n) => n.date === date)
        .sort((x, y) => y.flooded_km2 - x.flooded_km2)
        .slice(0, 5);
      if (places.length === 0) return { error: `No neighbourhood impact for ${date}` };
      return { date, places };
    }

    case "get_limits":
      return stats.limits.map((l) => ({ title: l.title[lang], body: l.body[lang] }));

    default:
      return { error: `Unknown tool ${name}` };
  }
}

/* ----------------------------------------------------------------- handler */

interface NodeRequest {
  method?: string;
  body?: unknown;
}

interface NodeResponse {
  status: (code: number) => NodeResponse;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string) => void;
}

function readBody(body: unknown): { question?: string; lang?: string } | null {
  if (!body) return null;
  if (typeof body === "string") {
    try {
      return JSON.parse(body) as { question?: string; lang?: string };
    } catch {
      return null;
    }
  }
  if (typeof body === "object") return body as { question?: string; lang?: string };
  return null;
}

export default async function handler(req: NodeRequest, res: NodeResponse): Promise<void> {
  res.setHeader("cache-control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    res.status(501).json({ error: "Assistant not configured" });
    return;
  }

  const body = readBody(req.body);
  if (!body) {
    res.status(400).json({ error: "Invalid JSON" });
    return;
  }

  const question = String(body.question ?? "").slice(0, 600).trim();
  const lang: Lang = body.lang === "fr" ? "fr" : "en";
  if (!question) {
    res.status(400).json({ error: "Missing question" });
    return;
  }

  let stats: Stats;
  try {
    stats = await loadStats();
  } catch {
    res.status(503).json({ error: "Data unavailable" });
    return;
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const ai = new GoogleGenAI({ apiKey });

    const contents: Array<{ role: string; parts: Array<Record<string, unknown>> }> = [
      { role: "user", parts: [{ text: question }] },
    ];

    let usedTool: string | undefined;
    let answer = "";

    for (let turn = 0; turn < 4; turn += 1) {
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: `${SYSTEM_PROMPT}\nReply in ${lang === "fr" ? "French" : "English"}.`,
          temperature: 0.2,
          maxOutputTokens: 400,
          // Declarations use Gemini's wire strings ("OBJECT"/"STRING"); the SDK
          // types those as a string enum, so bridge them once here.
          tools: [{ functionDeclarations: FUNCTION_DECLARATIONS as unknown as FunctionDeclaration[] }],
        },
      });

      const calls = response.functionCalls ?? [];
      if (calls.length === 0) {
        answer = response.text ?? "";
        break;
      }

      contents.push({
        role: "model",
        parts: calls.map((call) => ({
          functionCall: { name: call.name, args: call.args ?? {} },
        })),
      });

      contents.push({
        role: "user",
        parts: calls.map((call) => {
          usedTool = call.name ?? usedTool;
          const result = runTool(
            call.name ?? "",
            (call.args ?? {}) as Record<string, unknown>,
            stats,
            lang,
          );
          return { functionResponse: { name: call.name, response: { result } } };
        }),
      });
    }

    if (!answer) {
      answer =
        lang === "fr"
          ? "Je n'ai pas trouvé ce chiffre dans les fichiers FloodSight."
          : "I could not find that figure in FloodSight's files.";
    }

    res.status(200).json({ answer, tool: usedTool, lang });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown";
    res.status(502).json({ error: "Assistant failed", detail: message });
  }
}
