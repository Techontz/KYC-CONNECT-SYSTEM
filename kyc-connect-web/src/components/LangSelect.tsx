"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import type { Lang } from "@/lib/content";
import { useLang } from "./LangProvider";

const options: { value: Lang; label: string; code: string }[] = [
  { value: "sw", label: "Kiswahili", code: "SW" },
  { value: "en", label: "English", code: "EN" },
];

function Flag({ code }: { code: Lang }) {
  if (code === "sw")
    return (
      <svg viewBox="0 0 30 20" className="h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10" aria-hidden="true">
        <path d="M0 0h30v20H0z" fill="#1eb53a" />
        <path d="M30 0v20H0z" fill="#00a3dd" />
        <path d="M0 20 30 0" stroke="#fcd116" strokeWidth="9" />
        <path d="M0 20 30 0" stroke="#000" strokeWidth="5.5" />
      </svg>
    );
  return (
    <svg viewBox="0 0 60 40" className="h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-black/10" aria-hidden="true">
      <path d="M0 0h60v40H0z" fill="#012169" />
      <path d="M0 0l60 40M60 0 0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0l60 40M60 0 0 40" stroke="#C8102E" strokeWidth="3" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="7" />
    </svg>
  );
}

/** Accessible language dropdown (listbox pattern) with flags. */
export function LangSelect({ full = false, dark = false }: { full?: boolean; dark?: boolean }) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const current = options.find((o) => o.value === lang) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    listRef.current?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openMenu = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === lang)));
    setOpen(true);
  };

  const choose = (i: number) => {
    setLang(options[i].value);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(active);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      if (e.key === "Escape") btnRef.current?.focus();
    }
  };

  return (
    <div ref={wrap} className={`relative ${full ? "w-full" : ""}`}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`Lugha / Language: ${current.label}`}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openMenu();
          }
        }}
        className={`inline-flex h-[43px] items-center gap-1 whitespace-nowrap rounded-[8px] border px-2 text-[16px] font-normal transition ${
          dark ? "border-white/60 text-white hover:bg-white/10" : "border-brand text-brand hover:bg-mint-50"
        } ${full ? "w-full justify-between" : ""}`}
      >
        <span className="inline-flex items-center gap-2">
          <Globe className="size-5" strokeWidth={1.75} aria-hidden="true" />
          {current.label}
        </span>
        <ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label="Lugha / Language"
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onListKey}
          className={`absolute z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-white p-1.5 text-ink shadow-chip outline-none ${
            full ? "bottom-full mb-2 w-full" : "right-0 w-52"
          }`}
        >
          {options.map((o, i) => {
            const selected = o.value === lang;
            return (
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 text-[15px] ${
                  i === active ? "bg-mint-50" : ""
                } ${selected ? "font-bold" : "font-medium"}`}
              >
                <span className="inline-flex items-center gap-3">
                  <Flag code={o.value} />
                  {o.label}
                  <span className="text-[12px] font-semibold text-muted">{o.code}</span>
                </span>
                {selected && <Check className="size-4 text-brand-700" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
