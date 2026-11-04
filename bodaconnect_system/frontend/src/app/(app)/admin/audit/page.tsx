"use client";

import { Fragment, Suspense, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { useI18n } from "@/i18n";
import { useApi } from "@/lib/hooks";
import { useUrlState } from "@/lib/useUrlState";
import { formatDateTime, humanize } from "@/lib/format";
import type { AuditEvent, ID, ListResponse } from "@/lib/types";
import { Card, EmptyState, ErrorState, Input, PageHeader, Pagination, SkeletonRows, Table, TD, TH, THead, TR } from "@/components/ui";

const KEYS = ["actorId", "action", "entityType", "from", "to"] as const;

function Audit() {
  const { t, tx, lang } = useI18n();
  const { values, set, page } = useUrlState(KEYS);
  const [open, setOpen] = useState<ID | null>(null);
  const q = useApi<ListResponse<AuditEvent>>("/audit-events", { ...values, page, perPage: 50 }, { placeholderData: (p) => p });

  return (
    <>
      <Link href="/admin" className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {t("nav.admin")}
      </Link>
      <PageHeader eyebrow={t("audit.eyebrow")} title={t("audit.title")} description={t("audit.subtitle")} />
      <Card className="mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <Input label={t("audit.action")} placeholder="rider.created" defaultValue={values.action} onBlur={(e) => set({ action: e.target.value.trim() })} />
        <Input label={t("audit.entityType")} placeholder="person" defaultValue={values.entityType} onBlur={(e) => set({ entityType: e.target.value.trim() })} />
        <Input label={t("audit.actorId")} defaultValue={values.actorId} onBlur={(e) => set({ actorId: e.target.value.trim() })} />
        <Input label={t("audit.from")} type="date" value={values.from} onChange={(e) => set({ from: e.target.value })} />
        <Input label={t("audit.to")} type="date" value={values.to} onChange={(e) => set({ to: e.target.value })} />
      </Card>
      {q.isPending ? (
        <SkeletonRows rows={8} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data.data.length ? (
        <Card>
          <EmptyState kind="search" title={t("audit.none")} />
        </Card>
      ) : (
        <>
          <Card className="overflow-hidden">
            <Table>
              <caption className="sr-only">{t("audit.title")}</caption>
              <THead>
                <tr>
                  <TH>{t("audit.when")}</TH>
                  <TH>{t("audit.action")}</TH>
                  <TH>{t("audit.actor")}</TH>
                  <TH>{t("audit.entity")}</TH>
                  <TH>{t("error.requestId")}</TH>
                  <TH>
                    <span className="sr-only">{t("audit.details")}</span>
                  </TH>
                </tr>
              </THead>
              <tbody>
                {q.data.data.map((e) => (
                  <Fragment key={e.id}>
                    <TR>
                      <TD className="whitespace-nowrap text-muted">{formatDateTime(e.createdAt ?? e.at, lang)}</TD>
                      <TD>
                        <span className="font-semibold">{tx(`audit.${e.action}`, humanize(e.action))}</span>
                        <span className="block font-mono text-xs text-muted">{e.action}</span>
                      </TD>
                      <TD>{e.actorName ?? e.actorId ?? t("common.system")}</TD>
                      <TD className="font-mono text-xs">
                        {e.entityType ?? "-"}
                        {e.entityId ? `#${e.entityId}` : ""}
                      </TD>
                      <TD className="max-w-40 truncate font-mono text-xs" title={e.requestId ?? ""}>
                        {e.requestId ?? "-"}
                      </TD>
                      <TD>
                        {e.metadata && Object.keys(e.metadata).length > 0 && (
                          <button
                            type="button"
                            aria-expanded={open === e.id}
                            aria-label={t("audit.details")}
                            onClick={() => setOpen(open === e.id ? null : e.id)}
                            className="inline-flex size-9 items-center justify-center rounded-full hover:bg-mint"
                          >
                            {open === e.id ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
                          </button>
                        )}
                      </TD>
                    </TR>
                    {open === e.id && (
                      <tr className="bg-surface">
                        <td colSpan={6} className="px-4 py-3">
                          <pre className="overflow-x-auto text-xs whitespace-pre-wrap">{JSON.stringify(e.metadata, null, 2)}</pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </Table>
          </Card>
          <Pagination meta={q.data.meta} onPage={(p) => set({ page: p })} />
        </>
      )}
    </>
  );
}

export default function AuditPage() {
  return (
    <Suspense fallback={<SkeletonRows rows={8} />}>
      <Audit />
    </Suspense>
  );
}
