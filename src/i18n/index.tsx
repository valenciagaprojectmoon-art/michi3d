import { createContext, createElement, Fragment, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { EN } from "./en";

/** Idiomas disponibles. El español es el idioma base: sus textos son las claves de t(). */
export type Lang = "es" | "en";
export const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
];

const DICTIONARIES: Record<Exclude<Lang, "es">, Record<string, string>> = { en: EN };
const STORAGE_KEY = "michi3d-lang";

export function isLang(value: unknown): value is Lang {
  return value === "es" || value === "en";
}

/** Reemplaza {nombre} por su valor. Si falta un parámetro, deja el marcador tal cual. */
function format(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (m, key: string) => (key in params ? String(params[key]) : m));
}

/** Traducción pura (sin React): útil para tests. Sin traducción disponible → español. */
export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const text = lang === "es" ? key : (DICTIONARIES[lang][key] ?? key);
  return format(text, params);
}

/** Idioma inicial: el guardado por el usuario, si no el del navegador (en* → inglés), si no español. */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // localStorage puede no estar disponible (modo privado): se ignora.
  }
  const nav = typeof navigator !== "undefined" ? navigator.language : "es";
  return nav.toLowerCase().startsWith("en") ? "en" : "es";
}

/** Enlaces a las páginas legales en el idioma activo. */
export function legalHref(lang: Lang, kind: "terms" | "privacy"): string {
  if (lang === "en") return kind === "terms" ? "/terms.html" : "/privacy.html";
  return kind === "terms" ? "/terminos.html" : "/privacidad.html";
}

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Texto traducido. */
  t: (key: string, params?: Record<string, string | number>) => string;
  /** Como t(), pero los parámetros pueden ser elementos React (negritas, enlaces). */
  tx: (key: string, params: Record<string, ReactNode>) => ReactNode;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children, onLangChange }: { children: ReactNode; onLangChange?: (lang: Lang) => void }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    onLangChange?.(lang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin almacenamiento: el idioma solo dura esta sesión.
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      t: (key, params) => translate(lang, key, params),
      tx: (key, params) => {
        const template = translate(lang, key);
        const parts = template.split(/(\{\w+\})/g);
        return createElement(
          Fragment,
          null,
          parts.map((part, i) => {
            const m = part.match(/^\{(\w+)\}$/);
            return m && m[1] in params ? createElement(Fragment, { key: i }, params[m[1]]) : part;
          })
        );
      },
    }),
    [lang, setLang]
  );

  return createElement(I18nContext.Provider, { value }, children);
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n debe usarse dentro de <I18nProvider>.");
  return ctx;
}
