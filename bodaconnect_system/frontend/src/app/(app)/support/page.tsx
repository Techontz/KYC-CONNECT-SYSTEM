"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, LifeBuoy, Plus, XCircle } from "lucide-react";
import { useI18n } from "@/i18n";
import { ApiError, api, applyFieldErrors } from "@/lib/api";
import { useApi, useIdempotencyKey, useMe } from "@/lib/hooks";
import { hasRole, isStaff } from "@/lib/roles";
import { formatDateTime, humanize } from "@/lib/format";
import type { ListResponse, SupportRequest } from "@/lib/types";
import { Badge, Button, Card, Drawer, EmptyState, ErrorState, Input, PageHeader, Pagination, RadioCard, Select, SkeletonRows, StatusPill, Tabs, Textarea, useToast } from "@/components/ui";

const FILTERS = ["active", "resolved", "rejected", "all"] as const;

function requesterName(r: SupportRequest) {
  if (!r.requestedBy) return r.requesterName ?? null;
  return typeof r.requestedBy === "string" ? r.requestedBy : (r.requestedBy.name ?? null);
}

export default function SupportPage() {
  const { t, tx, lang } = useI18n();
  const me = useMe();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("active");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [resolving, setResolving] = useState<SupportRequest | null>(null);
  const q = useApi<ListResponse<SupportRequest>>("/support-requests", {
    status: filter === "active" ? "open,in_progress" : filter === "all" ? undefined : filter,
    page,
    perPage: 20,
  });
  const staff = isStaff(me.data);
  const canResolve = hasRole(me.data, "verifier", "platform_admin", "association_admin");

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow={t("support.eyebrow")}
        title={t("support.title")}
        description={staff ? t("support.subtitleStaff") : t("support.subtitle")}
        actions={
          <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setCreateOpen(true)}>
            {t("support.new")}
          </Button>
        }
      />
      <Tabs
        className="mb-4"
        value={filter}
        onChange={(k) => {
          setFilter(k as (typeof FILTERS)[number]);
          setPage(1);
        }}
        items={FILTERS.map((f) => ({ key: f, label: t(`support.filter.${f}` as "support.filter.all") }))}
      />
      {q.isPending ? (
        <SkeletonRows rows={4} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data.data.length ? (
        <Card>
          <EmptyState title={t("support.empty")} description={t("support.emptyHint")} />
        </Card>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-2">
            {q.data.data.map((r) => (
              <li key={r.id}>
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={r.category === "complaint" ? "danger" : r.category === "correction" ? "info" : "neutral"}>{tx(`supportCategory.${r.category}`, r.category)}</Badge>
                      <StatusPill status={r.status} />
                    </div>
                    <span className="text-xs text-muted">{formatDateTime(r.createdAt, lang)}</span>
                  </div>
                  {(r.subjectName || r.subject) && (
                    <p className="mt-2 text-sm">
                      <span className="text-muted">{t("support.subject")}: </span>
                      {r.subjectPersonId ? (
                        <Link href={`/riders/${r.subjectPersonId}`} className="font-semibold hover:underline">
                          {r.subjectName ?? r.subject?.legalName}
                        </Link>
                      ) : (
                        <span className="font-semibold">{r.subjectName ?? r.subject?.legalName}</span>
                      )}
                      {r.subjectSystemId && <span className="ml-1 font-mono text-xs text-muted">{r.subjectSystemId}</span>}
                    </p>
                  )}
                  {r.category === "correction" && r.field && (
                    <p className="mt-2 rounded-[12px] bg-info-50 px-3 py-2 text-sm text-info-900">
                      {tx(`field.${r.field}`, humanize(r.field))}: <strong>{r.proposedValue}</strong>
                      {r.reason ? <span className="block text-xs">{r.reason}</span> : null}
                    </p>
                  )}
                  {r.description && <p className="mt-2 text-sm text-ink">{r.description}</p>}
                  {requesterName(r) && <p className="mt-1 text-xs text-muted">{t("support.requestedBy", { name: requesterName(r)! })}</p>}
                  {r.resolutionSummary && (
                    <p className="mt-2 rounded-[12px] bg-surface px-3 py-2 text-sm">
                      <strong>{t("support.resolution")}:</strong> {r.resolutionSummary}
                    </p>
                  )}
                  {canResolve && (r.status === "open" || r.status === "in_progress") && (
                    <div className="mt-3 flex justify-end">
                      <Button size="sm" variant="secondary" onClick={() => setResolving(r)}>
                        {t("support.resolve")}
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            ))}
          </ul>
          <Pagination meta={q.data.meta} onPage={setPage} />
        </>
      )}
      <CreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <ResolveDrawer request={resolving} onClose={() => setResolving(null)} />
    </div>
  );
}

function CreateDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, tx } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const me = useMe();
  const idem = useIdempotencyKey();
  const staff = isStaff(me.data);
  const schema = z.object({
    category: z.enum(["correction", "help", "complaint"]),
    description: z.string().trim().min(10, t("validation.description")).max(2000),
    subjectPersonId: z.string().optional(),
  });
  type V = z.infer<typeof schema>;
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { category: "help", description: "", subjectPersonId: "" } });
  const m = useMutation({
    mutationFn: (v: V) =>
      api("/support-requests", {
        method: "POST",
        idempotencyKey: idem.get(),
        body: { category: v.category, description: v.description, subjectPersonId: v.subjectPersonId || (staff ? undefined : me.data?.person?.id) },
      }),
    onSuccess: () => {
      idem.reset();
      toast.success(t("support.created"));
      qc.invalidateQueries({ queryKey: ["/support-requests"] });
      form.reset();
      onClose();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.isDefinitive) idem.reset();
      applyFieldErrors(e, form.setError);
      toast.error(e);
    },
  });
  const er = form.formState.errors;
  const submit = form.handleSubmit((v) => m.mutate(v));
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("support.new")}
      description={t("support.newHint")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} loading={m.isPending} icon={<LifeBuoy className="size-4" aria-hidden />}>
            {t("support.send")}
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4" onSubmit={submit} noValidate>
        <Select label={t("support.category")} required options={["help", "correction", "complaint"].map((c) => ({ value: c, label: tx(`supportCategory.${c}`, c) }))} {...form.register("category")} />
        {staff && <Input label={t("support.subjectId")} optionalLabel={t("common.optional")} hint={t("support.subjectIdHint")} {...form.register("subjectPersonId")} />}
        <Textarea label={t("support.description")} required rows={5} error={er.description?.message} {...form.register("description")} />
        {!staff && <p className="text-[13px] text-muted">{t("support.correctionTip")}</p>}
      </form>
    </Drawer>
  );
}

function ResolveDrawer({ request, onClose }: { request: SupportRequest | null; onClose: () => void }) {
  const { t, tx } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState<"resolved" | "rejected">("resolved");
  const [summary, setSummary] = useState("");
  const [error, setError] = useState<string | null>(null);
  const m = useMutation({
    mutationFn: () => api(`/support-requests/${request!.id}/resolve`, { method: "POST", body: { status, resolutionSummary: summary.trim() } }),
    onSuccess: () => {
      toast.success(t("support.resolvedToast"));
      qc.invalidateQueries({ queryKey: ["/support-requests"] });
      if (request?.subjectPersonId) qc.invalidateQueries({ queryKey: [`/riders/${request.subjectPersonId}`] });
      setSummary("");
      onClose();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.fieldErrors.resolutionSummary) setError(e.fieldErrors.resolutionSummary);
      toast.error(e);
    },
  });
  return (
    <Drawer
      open={request !== null}
      onClose={onClose}
      title={t("support.resolve")}
      description={request?.category === "correction" ? t("support.resolveCorrectionHint") : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            loading={m.isPending}
            variant={status === "rejected" ? "danger" : "primary"}
            onClick={() => {
              if (summary.trim().length < 5) return setError(t("validation.reason"));
              setError(null);
              m.mutate();
            }}
          >
            {t("common.save")}
          </Button>
        </>
      }
    >
      {request && (
        <div className="grid grid-cols-1 gap-3">
          {request.category === "correction" && request.field && (
            <p className="rounded-[12px] bg-info-50 p-3 text-sm text-info-900">
              {tx(`field.${request.field}`, humanize(request.field))} → <strong>{request.proposedValue}</strong>
            </p>
          )}
          <RadioCard name="res" checked={status === "resolved"} onChange={() => setStatus("resolved")} icon={<CheckCircle2 className="size-5 text-brand" aria-hidden />} title={request.category === "correction" ? t("support.approve") : t("status.resolved")} />
          <RadioCard name="res" checked={status === "rejected"} onChange={() => setStatus("rejected")} icon={<XCircle className="size-5 text-danger" aria-hidden />} title={t("status.rejected")} />
          <Textarea label={t("support.resolution")} required rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} error={error ?? undefined} />
        </div>
      )}
    </Drawer>
  );
}
