import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./en";
import { fr } from "./fr";

export const LANGS = ["en", "fr"] as const;
export type Lang = (typeof LANGS)[number];

const STORAGE_KEY = "floodsight.lang";

export function storedLang(): Lang {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "en" || saved === "fr") return saved;
  const nav = window.navigator.language.toLowerCase();
  return nav.startsWith("fr") ? "fr" : "en";
}

export function persistLang(lang: Lang) {
  window.localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
}

const initialLang = storedLang();
if (typeof document !== "undefined") document.documentElement.lang = initialLang;

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
  },
  lng: initialLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
