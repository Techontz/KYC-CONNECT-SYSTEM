"use client";

import { useId, useRef, type ReactNode } from "react";
import { cn } from "./cn";

export interface TabItem {
  key: string;
  label: ReactNode;
  count?: number;
}

/** WAI-ARIA tabs with arrow-key navigation; horizontally scrollable on small screens. */
export function Tabs({
  items,
  value,
  onChange,
  className,
  idBase,
}: {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
  idBase?: string;
}) {
  const auto = useId();
  const base = idBase ?? auto;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    else return;
    e.preventDefault();
    refs.current[next]?.focus();
    onChange(items[next].key);
  };
  return (
    <div role="tablist" className={cn("-mx-1 flex gap-1 overflow-x-auto border-b border-line px-1", className)}>
      {items.map((it, i) => {
        const selected = it.key === value;
        return (
          <button
            key={it.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${it.key}`}
            aria-selected={selected}
            aria-controls={`${base}-panel-${it.key}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(it.key)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "relative -mb-px inline-flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-3.5 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30",
              selected ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span className={cn("rounded-full px-1.5 text-xs", selected ? "bg-mint text-forest" : "bg-surface text-muted")}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idBase, tabKey, children }: { idBase: string; tabKey: string; children: ReactNode }) {
  return (
    <div role="tabpanel" id={`${idBase}-panel-${tabKey}`} aria-labelledby={`${idBase}-tab-${tabKey}`} tabIndex={0} className="pt-5 focus-visible:outline-none">
      {children}
    </div>
  );
}
