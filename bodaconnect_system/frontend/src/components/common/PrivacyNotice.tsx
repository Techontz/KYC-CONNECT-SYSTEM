"use client";

import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import type { ItemResponse, PrivacyNotice } from "@/lib/types";
import { ErrorState, Skeleton } from "@/components/ui";

export function useActiveNotice() {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ["privacy-notice", lang],
    queryFn: async () => (await api<ItemResponse<PrivacyNotice>>("/privacy/notices/active", { query: { language: lang } })).data,
    staleTime: 10 * 60_000,
  });
}

/** Renders notice text: blank lines become paragraphs, lines starting with "#" become headings, "-"/"*" become bullets. */
export function NoticeBody({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <div className="flex flex-col gap-3 text-[15px] leading-relaxed text-ink">
      {blocks.map((b, i) => {
        const lines = b.split("\n").filter(Boolean);
        if (!lines.length) return null;
        if (/^#{1,6}\s/.test(lines[0]) && lines.length === 1)
          return (
            <h3 key={i} className="pt-2 text-base font-bold">
              {lines[0].replace(/^#+\s*/, "")}
            </h3>
          );
        if (lines.every((l) => /^\s*[-*•]\s/.test(l)))
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{l.replace(/^\s*[-*•]\s/, "")}</li>
              ))}
            </ul>
          );
        return (
          <p key={i} className="whitespace-pre-line">
            {b.replace(/^#+\s*/, "")}
          </p>
        );
      })}
    </div>
  );
}

export function ActiveNotice({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const q = useActiveNotice();
  if (q.isPending) return <Skeleton className="h-48 w-full" />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  return (
    <div>
      <p className="mb-3 text-sm text-muted">
        {t("privacy.version")}: <strong className="font-mono text-ink">{q.data.version}</strong> · {q.data.language?.toUpperCase()}
      </p>
      <div className={compact ? "max-h-72 overflow-y-auto rounded-[12px] border border-line bg-surface p-4" : ""} tabIndex={compact ? 0 : undefined}>
        <NoticeBody content={q.data.content} />
      </div>
    </div>
  );
}
