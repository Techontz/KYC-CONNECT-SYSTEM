"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useI18n, type Lang } from "@/i18n";
import { cn } from "@/components/ui";

const OPTIONS: { value: Lang; label: string; code: string }[] = [
  { value: "sw", label: "Kiswahili", code: "SW" },
  { value: "en", label: "English", code: "EN" },
];

/**
 * Accessible language dropdown (listbox pattern): button with aria-haspopup="listbox";
 * ArrowUp/ArrowDown/Home/End move, Enter/Space select, Escape/Tab/outside click close.
 */
export function LanguageSelect({ dark = false, align = "right", block = false }: { dark?: boolean; align?: "left" | "right"; block?: boolean }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const id = useId();
  const listId = `${id}-list`;
  const current = OPTIONS.find((o) => o.value === lang) ?? OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    listRef.current?.focus();
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [open]);

  const openMenu = (index?: number) => {
    setActive(index ?? Math.max(0, OPTIONS.findIndex((o) => o.value === lang)));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  };
  const choose = (i: number) => {
    setLang(OPTIONS[i].value);
    close();
  };

  const onButtonKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      openMenu(e.key === "ArrowUp" ? OPTIONS.length - 1 : undefined);
    }
  };
  const onListKey = (e: KeyboardEvent<HTMLUListElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => (a + 1) % OPTIONS.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => (a - 1 + OPTIONS.length) % OPTIONS.length);
        break;
      case "Home":
        e.preventDefault();
        setActive(0);
        break;
      case "End":
        e.preventDefault();
        setActive(OPTIONS.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
    }
  };

  return (
    <div ref={wrapRef} className={cn("relative", block ? "w-full" : "inline-block")}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${t("common.language")}: ${current.label}`}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onButtonKey}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full border px-3.5 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/35",
          block && "w-full",
          dark ? "border-white/20 text-white hover:bg-white/5" : "border-line bg-white text-ink hover:bg-surface",
        )}
      >
        <Globe className={cn("size-4 shrink-0", dark ? "text-mint" : "text-muted")} aria-hidden />
        <span className={cn(block && "flex-1 text-left")}>{current.label}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180", dark ? "text-mint" : "text-muted")} aria-hidden />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={t("common.language")}
          aria-activedescendant={`${id}-opt-${active}`}
          onKeyDown={onListKey}
          className={cn(
            "bc-animate-in absolute z-50 mt-2 min-w-48 rounded-[16px] border border-line bg-white p-1.5 shadow-float focus:outline-none",
            align === "right" ? "right-0" : "left-0",
            block && "w-full",
          )}
        >
          {OPTIONS.map((o, i) => {
            const selected = o.value === lang;
            return (
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={selected}
                lang={o.value}
                onClick={() => choose(i)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 text-sm text-ink",
                  i === active && "bg-mint-50",
                  selected && "font-bold",
                )}
              >
                <span>
                  {o.label} <span className="text-muted">({o.code})</span>
                </span>
                {selected ? <Check className="size-4 text-brand" aria-hidden /> : <span className="size-4" aria-hidden />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
