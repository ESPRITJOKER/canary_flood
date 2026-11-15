import { useTranslation } from "react-i18next";
import { persistLang, type Lang } from ".";

export function useLang(): Lang {
  const { i18n } = useTranslation();
  return (i18n.language === "fr" ? "fr" : "en") satisfies Lang;
}

export function useSetLang() {
  const { i18n } = useTranslation();
  return (lang: Lang) => {
    void i18n.changeLanguage(lang);
    persistLang(lang);
  };
}
