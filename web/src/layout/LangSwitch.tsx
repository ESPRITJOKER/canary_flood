import { Globe2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cx } from "../components/ui";
import { useLang, useSetLang } from "../i18n/use-lang";

export function LangSwitch({ compact = false }: { compact?: boolean }) {
  const lang = useLang();
  const setLang = useSetLang();
  const { t } = useTranslation();

  return (
    <div
      className="flex items-center gap-0.5 rounded-full bg-surface-container-high p-0.5"
      role="group"
      aria-label={t("common.language")}
    >
      {!compact && <Globe2 className="ml-1.5 h-3.5 w-3.5 text-on-surface-variant" aria-hidden />}
      {(["fr", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className={cx(
            "min-h-[36px] rounded-full px-2.5 text-label-sm font-semibold transition-colors",
            lang === code
              ? "bg-surface-container-lowest text-primary-container shadow-card"
              : "text-on-surface-variant hover:text-on-surface",
          )}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
