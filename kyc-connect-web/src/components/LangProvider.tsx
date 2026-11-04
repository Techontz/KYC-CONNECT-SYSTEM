"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getContent, type Content, type Lang } from "@/lib/content";

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: Content };
const LangContext = createContext<Ctx | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("sw");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kyc-lang");
      if (saved === "en" || saved === "sw") setLangState(saved);
    } catch {
      /* storage unavailable: keep Swahili default */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("kyc-lang", l);
    } catch {
      /* ignore */
    }
  };

  return <LangContext.Provider value={{ lang, setLang, t: getContent(lang) }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}
