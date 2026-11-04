"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, UserCheck } from "lucide-react";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { useApi } from "@/lib/hooks";
import { useUrlState } from "@/lib/useUrlState";
import { ageHours, ageLabel, humanize } from "@/lib/format";
import type { ID, ListResponse, VerificationCase } from "@/lib/types";
import { Badge, Button, Card, Checkbox, EmptyState, ErrorState, PageHeader, Pagination, Select, SkeletonRows, StatusPill, Table, TD, TH, THead, TR, useToast } from "@/components/ui";

const STATUSES = ["submitted", "under_review", "verified", "correction_required", "rejected"];
const TYPES = ["identity", "phone", "vehicle", "membership"];

function Age({ at }: { at: string }) {
  const { lang, t } = useI18n();
  const h = ageHours(at);
  const old = h > 72;
  return (
    <Badge tone={old ? "warning" : "neutral"} icon={<Clock className="size-3.5" aria-hidden />}>
      {ageLabel(at, lang)}
      {old && <span className="sr-only"> ({t("verification.overdue")})</span>}
    </Badge>
  );
}

function Queue() {
  const { t, tx } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const { values, set, page } = useUrlState(["status", "verificationType", "assignedTo"] as const);
  const status = values.status || "open";
  const q = useApi<ListResponse<VerificationCase>>(
    "/verification-cases",
    { status: status === "open" ? undefined : status, verificationType: values.verificationType, assignedTo: values.assignedTo, page, perPage: 25 },
    { placeholderData: (p) => p },
  );
  const rows = (q.data?.data ?? []).filter((c) => status !== "open" || c.status === "submitted" || c.status === "under_review");

  const assign = useMutation({
    mutationFn: (id: ID) => api(`/verification-cases/${id}/assign`, { method: "POST", body: {} }),
    onSuccess: () => {
      toast.success(t("verification.assigned"));
      qc.invalidateQueries({ queryKey: ["/verification-cases"] });
    },
    onError: (e) => toast.error(e),
  });

  const subjectName = (c: VerificationCase) => c.subject?.legalName ?? c.person?.legalName ?? c.subjectName ?? "-";
  const assignee = (c: VerificationCase) => c.assignedTo?.name ?? c.assignedTo?.legalName ?? c.assignedToName;

  return (
    <>
      <PageHeader eyebrow={t("verification.eyebrow")} title={t("verification.title")} description={t("verification.subtitle")} />
      <Card className="mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:items-end">
        <Select
          label={t("common.status")}
          options={[{ value: "open", label: t("verification.openCases") }, ...STATUSES.map((s) => ({ value: s, label: tx(`status.${s}`, s) }))]}
          value={status}
          onChange={(e) => set({ status: e.target.value === "open" ? null : e.target.value })}
        />
        <Select
          label={t("verification.type")}
          placeholder={t("common.all")}
          options={TYPES.map((s) => ({ value: s, label: tx(`verificationType.${s}`, s) }))}
          value={values.verificationType}
          onChange={(e) => set({ verificationType: e.target.value })}
        />
        <Checkbox label={t("verification.assignedToMe")} checked={values.assignedTo === "me"} onChange={(e) => set({ assignedTo: e.target.checked ? "me" : null })} />
      </Card>

      {q.isPending ? (
        <SkeletonRows rows={6} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !rows.length ? (
        <Card>
          <EmptyState title={t("verification.queueEmpty")} description={t("verification.queueEmptyHint")} />
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <caption className="sr-only">{t("verification.title")}</caption>
              <THead>
                <tr>
                  <TH>{t("verification.subject")}</TH>
                  <TH>{t("verification.type")}</TH>
                  <TH>{t("common.status")}</TH>
                  <TH>{t("verification.age")}</TH>
                  <TH>{t("verification.assignee")}</TH>
                  <TH>
                    <span className="sr-only">{t("common.actions")}</span>
                  </TH>
                </tr>
              </THead>
              <tbody>
                {rows.map((c) => (
                  <TR key={c.id}>
                    <TD>
                      <Link href={`/verification/${c.id}`} className="font-semibold hover:underline">
                        {subjectName(c)}
                      </Link>
                      {c.subject?.systemId && <span className="block font-mono text-xs text-muted">{c.subject.systemId}</span>}
                    </TD>
                    <TD>{tx(`verificationType.${c.verificationType}`, humanize(c.verificationType))}</TD>
                    <TD>
                      <StatusPill status={c.status} />
                    </TD>
                    <TD>
                      <Age at={c.createdAt} />
                    </TD>
                    <TD>{assignee(c) ?? <span className="text-muted">{t("verification.unassigned")}</span>}</TD>
                    <TD className="whitespace-nowrap">
                      {!assignee(c) && (c.status === "submitted" || c.status === "under_review") ? (
                        <Button size="sm" variant="secondary" icon={<UserCheck className="size-4" aria-hidden />} loading={assign.isPending && assign.variables === c.id} onClick={() => assign.mutate(c.id)}>
                          {t("verification.assignMe")}
                        </Button>
                      ) : (
                        <Link href={`/verification/${c.id}`} className="text-sm font-semibold text-forest hover:underline">
                          {t("verification.review")}
                        </Link>
                      )}
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>
          <ul className="grid grid-cols-1 gap-2 md:hidden">
            {rows.map((c) => (
              <li key={c.id} className="rounded-[20px] border border-line bg-white p-4 shadow-soft">
                <Link href={`/verification/${c.id}`} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold">{subjectName(c)}</p>
                      <p className="text-sm text-muted">{tx(`verificationType.${c.verificationType}`, c.verificationType)}</p>
                    </div>
                    <StatusPill status={c.status} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
                    <Age at={c.createdAt} /> {assignee(c) ?? t("verification.unassigned")}
                  </div>
                </Link>
                {!assignee(c) && (c.status === "submitted" || c.status === "under_review") && (
                  <Button size="sm" variant="secondary" block className="mt-3" onClick={() => assign.mutate(c.id)}>
                    {t("verification.assignMe")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <Pagination meta={q.data.meta} onPage={(p) => set({ page: p })} />
        </>
      )}
    </>
  );
}

export default function VerificationPage() {
  return (
    <Suspense fallback={<SkeletonRows rows={6} />}>
      <Queue />
    </Suspense>
  );
}
