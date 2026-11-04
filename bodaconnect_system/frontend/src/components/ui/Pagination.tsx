"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n";
import type { ListMeta } from "@/lib/types";
import { IconButton } from "./Button";

export function Pagination({ meta, onPage }: { meta?: ListMeta; onPage: (page: number) => void }) {
  const { t } = useI18n();
  if (!meta || meta.total === 0) return null;
  const from = (meta.page - 1) * meta.perPage + 1;
  const to = Math.min(meta.total, meta.page * meta.perPage);
  return (
    <nav aria-label={t("common.pagination")} className="flex flex-wrap items-center justify-between gap-3 px-1 py-3 text-sm text-muted">
      <p>{t("common.showingRange", { from, to, total: meta.total })}</p>
      <div className="flex items-center gap-1">
        <IconButton label={t("common.previous")} disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)} className="disabled:opacity-40">
          <ChevronLeft className="size-5" aria-hidden />
        </IconButton>
        <span className="min-w-16 text-center font-semibold text-ink" aria-current="page">
          {meta.page} / {Math.max(1, meta.lastPage)}
        </span>
        <IconButton label={t("common.next")} disabled={meta.page >= meta.lastPage} onClick={() => onPage(meta.page + 1)} className="disabled:opacity-40">
          <ChevronRight className="size-5" aria-hidden />
        </IconButton>
      </div>
    </nav>
  );
}
