import type { ChangeEvent } from "react";
import { LANGUAGES, isLang, useI18n } from "./index";

/** Selector de idioma, siempre visible abajo a la izquierda (esa esquina no la usa nada más). */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  return (
    <select
      aria-label={t("Idioma")}
      title={t("Idioma")}
      value={lang}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
        if (isLang(e.target.value)) setLang(e.target.value);
      }}
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 50,
        padding: "6px 10px",
        borderRadius: 3,
        border: "1px solid var(--line)",
        background: "var(--surface)",
        color: "var(--text2)",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
