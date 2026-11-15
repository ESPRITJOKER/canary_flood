import type { Lang } from "../i18n";

const LOCALE: Record<Lang, string> = { en: "en-GB", fr: "fr-FR" };

export function formatDate(iso: string, lang: Lang, opts?: Intl.DateTimeFormatOptions): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return new Intl.DateTimeFormat(LOCALE[lang], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
    ...opts,
  }).format(date);
}

export function formatShortDate(iso: string, lang: Lang): string {
  return formatDate(iso, lang, { year: undefined });
}

export function formatLongDate(iso: string, lang: Lang): string {
  return formatDate(iso, lang, { day: "numeric", month: "long", year: "numeric" });
}

export function formatNumber(value: number, lang: Lang, digits = 2): string {
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatKm2(value: number, lang: Lang): string {
  const digits = value < 1 ? 2 : 1;
  return `${formatNumber(value, lang, digits)} km²`;
}

export function formatSignedKm2(value: number, lang: Lang): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatKm2(Math.abs(value), lang)}`;
}

export function formatMm(value: number | null, lang: Lang): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${formatNumber(value, lang, 0)} mm`;
}

export function formatDb(value: number, lang: Lang): string {
  return `${formatNumber(value, lang, 1)} dB`;
}

export function formatPercent(value: number, lang: Lang): string {
  return `${formatNumber(value, lang, 0)} %`;
}
