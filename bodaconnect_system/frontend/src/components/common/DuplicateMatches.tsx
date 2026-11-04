"use client";

import Link from "next/link";
import { CopyCheck, ExternalLink } from "lucide-react";
import { useI18n } from "@/i18n";
import type { DuplicateMatch } from "@/lib/types";
import { cn } from "@/components/ui";

export function DuplicateMatches({
  matches,
  blocking,
  onStop,
  className,
}: {
  matches: DuplicateMatch[];
  blocking?: boolean;
  onStop?: () => void;
  className?: string;
}) {
  const { t, tx } = useI18n();
  if (!matches.length) return null;
  return (
    <div
      role={blocking ? "alert" : "status"}
      className={cn("rounded-[16px] border p-4", blocking ? "border-danger/40 bg-danger-50" : "border-amber/50 bg-amber-50", className)}
    >
      <p className={cn("flex items-center gap-2 text-sm font-bold", blocking ? "text-danger-900" : "text-amber-900")}>
        <CopyCheck className="size-4" aria-hidden />
        {blocking ? t("duplicates.blockingTitle") : t("duplicates.possibleTitle", { count: matches.length })}
      </p>
      <p className="mt-1 text-sm text-ink">{blocking ? t("duplicates.blockingBody") : t("duplicates.possibleBody")}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {matches.map((m) => (
          <li key={`${m.id}-${m.reason}`} className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-white px-3 py-2 ring-1 ring-line">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{m.legalName}</p>
              <p className="text-xs text-muted">
                <span className="font-mono">{m.systemId}</span> · {t("duplicates.matchedOn")}: {tx(`duplicateReason.${m.reason}`, m.reason)}
                {m.registrationNumber ? ` (${m.registrationNumber})` : ""}
              </p>
            </div>
            {m.inScope === false ? (
              <span className="text-xs text-muted">{t("duplicates.outOfScope")}</span>
            ) : (
              <Link href={`/riders/${m.id}`} target="_blank" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-forest hover:underline">
                {t("duplicates.viewRecord")} <ExternalLink className="size-3.5" aria-hidden />
                <span className="sr-only">({t("common.opensNewTab")})</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
      {onStop && (
        <button type="button" onClick={onStop} className="mt-3 inline-flex min-h-11 items-center rounded-full bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-900">
          {t("duplicates.stopAndRefer")}
        </button>
      )}
    </div>
  );
}
