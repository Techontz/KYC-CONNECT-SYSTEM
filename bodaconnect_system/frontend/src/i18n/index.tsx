"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { sw, type MessageKey } from "./sw";
import { en } from "./en";

export type Lang = "sw" | "en";
export type { MessageKey };

const dictionaries: Record<Lang, Record<MessageKey, string>> = { sw, en };
const STORAGE_KEY = "bc_lang";

export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string;

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TFunction;
  /** Translate a dynamic key (e.g. enum value) with a fallback when it is not in the dictionary. */
  tx: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function interpolate(s: string, vars?: Record<string, string | number>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] !== undefined ? String(vars[k]) : `{${k}}`));
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("sw");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "sw") setLangState(saved);
    } catch {
      /* storage unavailable: keep Swahili default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18nValue>(() => {
    const dict = dictionaries[lang];
    const t: TFunction = (key, vars) => interpolate(dict[key] ?? key, vars);
    const tx = (key: string, fallback?: string) => {
      const v = (dict as Record<string, string>)[key];
      return v ?? fallback ?? key;
    };
    return { lang, setLang, t, tx };
  }, [lang, setLang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
