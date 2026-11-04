"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, BadgeCheck, Eye, FileText, Scale, UserCheck, XCircle } from "lucide-react";
import { useI18n } from "@/i18n";
import { ApiError, api, applyFieldErrors, downloadFile, fetchBlobUrl } from "@/lib/api";
import { useApi, useLookups } from "@/lib/hooks";
import { formatDateTime, humanize, toOptions } from "@/lib/format";
import type { DocumentMeta, ItemResponse, VerificationCase } from "@/lib/types";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  DefinitionList,
  EmptyState,
  ErrorState,
  Modal,
  RadioCard,
  Select,
  Skeleton,
  StatusPill,
  Textarea,
  useToast,
} from "@/components/ui";

const METHODS = ["document_review", "in_person", "association_confirmation", "phone_otp"] as const;
const FALLBACK_REASONS: Record<string, string[]> = {
  verified: ["documents_match", "confirmed_in_person", "confirmed_by_association"],
  correction_required: ["name_mismatch", "document_unclear", "missing_document", "wrong_group"],
  rejected: ["fraudulent_document", "duplicate_record", "not_a_member"],
};

function EvidenceViewer({ doc, onClose }: { doc: DocumentMeta | null; onClose: () => void }) {
  const { t, tx } = useI18n();
  const [state, setState] = useState<{ url: string; type: string } | { error: unknown } | null>(null);
  useEffect(() => {
    if (!doc) return;
    let url: string | null = null;
    let cancelled = false;
    fetchBlobUrl(`/documents/${doc.id}/download`)
      .then((r) => {
        url = r.url;
        if (!cancelled) setState(r);
        else URL.revokeObjectURL(r.url);
      })
      .catch((e) => !cancelled && setState({ error: e }));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setState(null);
    };
  }, [doc]);
  return (
    <Modal open={doc !== null} onClose={onClose} size="lg" title={doc ? tx(`documentType.${doc.documentType}`, humanize(doc.documentType)) : ""} description={t("verification.evidenceNote")}>
      {!state ? (
        <Skeleton className="h-96 w-full" />
      ) : "error" in state ? (
        <ErrorState error={state.error} />
      ) : state.type.startsWith("image/") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={state.url} alt={t("verification.evidenceAlt")} className="mx-auto max-h-[70vh] w-auto rounded-[12px] border border-line" />
      ) : state.type === "application/pdf" ? (
        <iframe src={state.url} title={t("verification.evidenceAlt")} className="h-[70vh] w-full rounded-[12px] border border-line" />
      ) : (
        <p className="text-sm text-muted">{t("verification.noPreview")}</p>
      )}
    </Modal>
  );
}

export default function VerificationCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, tx, lang } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const lookups = useLookups();
  const q = useApi<ItemResponse<VerificationCase>>(`/verification-cases/${id}`);
  const [viewing, setViewing] = useState<DocumentMeta | null>(null);
  const [sodError, setSodError] = useState<string | null>(null);

  const schema = z.object({
    outcome: z.enum(["verified", "correction_required", "rejected"], { message: t("validation.outcome") }),
    method: z.string().min(1, t("validation.required")),
    reasonCode: z.string().min(1, t("validation.reasonCode")),
    notes: z.string().trim().max(2000).optional(),
  });
  type V = z.infer<typeof schema>;
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { outcome: undefined, method: "document_review", reasonCode: "", notes: "" } });
  const outcome = useWatch({ control: form.control, name: "outcome" });
  useEffect(() => {
    form.setValue("reasonCode", "");
  }, [outcome, form]);
  const er = form.formState.errors;

  const reasonOptions = (() => {
    // v1.1: reason codes carry the outcome they belong to; show only those for the chosen outcome.
    const raw = lookups.data?.reasonCodes ?? [];
    const filtered = raw.filter((r) => typeof r === "string" || !r.outcome || !outcome || r.outcome === outcome);
    const fromApi = toOptions(filtered, lang).map((o) => ({ ...o, label: tx(`reason.${o.value}`, o.label) }));
    if (fromApi.length) return fromApi;
    return (FALLBACK_REASONS[outcome ?? "verified"] ?? []).map((r) => ({ value: r, label: tx(`reason.${r}`, humanize(r)) }));
  })();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: [`/verification-cases/${id}`] });
    qc.invalidateQueries({ queryKey: ["/verification-cases"] });
    qc.invalidateQueries({ queryKey: ["/dashboard/summary"] });
  };

  const assign = useMutation({
    mutationFn: () => api(`/verification-cases/${id}/assign`, { method: "POST", body: {} }),
    onSuccess: () => {
      toast.success(t("verification.assigned"));
      invalidate();
    },
    onError: (e) => toast.error(e),
  });

  const decide = useMutation({
    mutationFn: (v: V) => api(`/verification-cases/${id}/decision`, { method: "POST", body: v }),
    onSuccess: () => {
      setSodError(null);
      toast.success(t("verification.decisionSaved"));
      form.reset({ outcome: undefined, method: "document_review", reasonCode: "", notes: "" });
      invalidate();
      const subjectId = q.data?.data.subject?.id ?? q.data?.data.person?.id;
      if (subjectId) qc.invalidateQueries({ queryKey: [`/riders/${subjectId}`] });
    },
    onError: (e) => {
      if (e instanceof ApiError && e.code === "BUSINESS_RULE" && /separation|duties|submitted/i.test(e.message)) {
        setSodError(e.message);
        return;
      }
      applyFieldErrors(e, form.setError);
      toast.error(e);
    },
  });

  if (q.isPending) return <Skeleton className="h-96 w-full rounded-[20px]" />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const c = q.data.data;
  const subject = c.subject ?? c.person;
  const evidence = c.evidence ?? c.documents ?? [];
  const history = c.history ?? c.decisions ?? [];
  const open = c.status === "submitted" || c.status === "under_review";
  const assigneeName = c.assignedTo?.name ?? c.assignedTo?.legalName ?? c.assignedToName;
  const submitter = c.submittedBy?.name ?? c.submittedBy?.legalName ?? c.submittedByName;

  return (
    <div>
      <Link href="/verification" className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {t("verification.title")}
      </Link>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">
          {tx(`verificationType.${c.verificationType}`, humanize(c.verificationType))} · {subject?.legalName ?? c.subjectName ?? ""}
        </h1>
        <StatusPill status={c.status} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="grid grid-cols-1 content-start gap-4">
          <Card>
            <CardHeader
              title={t("verification.subject")}
              action={
                subject?.id ? (
                  <Link href={`/riders/${subject.id}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-forest hover:underline">
                    {t("verification.openProfile")}
                  </Link>
                ) : undefined
              }
            />
            <CardBody>
              <DefinitionList
                items={[
                  { label: t("rider.name"), value: subject?.legalName ?? "-" },
                  { label: t("rider.systemId"), value: <span className="font-mono">{subject?.systemId ?? "-"}</span> },
                  { label: t("rider.phone"), value: subject?.phoneMasked ?? "-" },
                  { label: t("rider.profileStatus"), value: <StatusPill status={subject?.profileStatus} /> },
                  { label: t("verification.submittedBy"), value: submitter ?? "-" },
                  { label: t("verification.assignee"), value: assigneeName ?? t("verification.unassigned") },
                  { label: t("verification.opened"), value: formatDateTime(c.createdAt, lang) },
                ]}
              />
              {open && !assigneeName && (
                <Button className="mt-5" variant="secondary" icon={<UserCheck className="size-4" aria-hidden />} loading={assign.isPending} onClick={() => assign.mutate()}>
                  {t("verification.assignMe")}
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("verification.evidence")} description={t("verification.evidenceHint")} />
            <CardBody>
              {evidence.length ? (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {evidence.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 rounded-[16px] border border-line p-3">
                      <FileText className="size-5 shrink-0 text-forest" aria-hidden />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{tx(`documentType.${d.documentType}`, humanize(d.documentType))}</p>
                        <p className="truncate text-xs text-muted">{formatDateTime(d.createdAt, lang)}</p>
                      </div>
                      <Button size="sm" variant="ghost" aria-label={`${t("verification.view")} ${tx(`documentType.${d.documentType}`, d.documentType)}`} onClick={() => setViewing(d)}>
                        <Eye className="size-4" aria-hidden />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => downloadFile(`/documents/${d.id}/download`, d.originalName ?? `document-${d.id}`).catch((e) => toast.error(e))}
                      >
                        {t("documents.download")}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title={t("verification.noEvidence")} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("verification.history")} />
            <CardBody>
              {history.length ? (
                <ol className="relative ml-2 border-l-2 border-line pl-5">
                  {history.map((d) => (
                    <li key={d.id} className="relative mb-5 last:mb-0">
                      <span className="absolute -left-[27px] top-1.5 size-3 rounded-full bg-forest ring-4 ring-white" aria-hidden />
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill status={d.outcome} />
                        <span className="text-sm text-muted">{tx(`method.${d.method}`, humanize(d.method))}</span>
                      </div>
                      <p className="mt-1 text-sm font-semibold">{tx(`reason.${d.reasonCode}`, humanize(d.reasonCode))}</p>
                      {d.notes && <p className="text-sm text-ink">{d.notes}</p>}
                      <p className="text-xs text-muted">
                        {d.decidedBy?.name ?? d.decidedByName ?? "-"} · {formatDateTime(d.decidedAt ?? d.createdAt, lang)}
                      </p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted">{t("verification.noDecisions")}</p>
              )}
            </CardBody>
          </Card>
        </div>

        <Card className="content-start self-start lg:sticky lg:top-20">
          <CardHeader eyebrow={<><Scale className="size-3.5" aria-hidden /> {t("verification.decisionEyebrow")}</>} title={t("verification.decision")} description={t("verification.decisionHint")} />
          <CardBody>
            {!open ? (
              <p className="rounded-[12px] bg-surface p-4 text-sm text-muted">{t("verification.closed")}</p>
            ) : (
              <form className="grid grid-cols-1 gap-4" onSubmit={form.handleSubmit((v) => decide.mutate(v))} noValidate>
                {sodError && (
                  <div role="alert" className="flex gap-3 rounded-[16px] border border-amber/60 bg-amber-50 p-4 text-sm">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-900" aria-hidden />
                    <div>
                      <p className="font-bold text-amber-900">{t("verification.sodTitle")}</p>
                      <p className="mt-1 text-ink">{t("verification.sodBody")}</p>
                      <p className="mt-1 text-xs text-muted">{sodError}</p>
                    </div>
                  </div>
                )}
                <fieldset className="grid grid-cols-1 gap-2">
                  <legend className="mb-2 text-sm font-semibold">
                    {t("verification.outcome")} <span className="text-danger">*</span>
                  </legend>
                  {(
                    [
                      ["verified", <BadgeCheck key="v" className="size-5 text-brand" aria-hidden />],
                      ["correction_required", <AlertTriangle key="c" className="size-5 text-amber-900" aria-hidden />],
                      ["rejected", <XCircle key="r" className="size-5 text-danger" aria-hidden />],
                    ] as const
                  ).map(([o, icon]) => (
                    <RadioCard key={o} value={o} checked={outcome === o} icon={icon} title={tx(`status.${o}`, o)} description={tx(`outcomeDesc.${o}`, "")} {...form.register("outcome")} />
                  ))}
                  {er.outcome && <p className="text-sm text-danger-900">{er.outcome.message}</p>}
                </fieldset>
                <Select label={t("verification.method")} required options={METHODS.map((m) => ({ value: m, label: tx(`method.${m}`, humanize(m)) }))} error={er.method?.message} {...form.register("method")} />
                <Select label={t("verification.reasonCode")} required placeholder={t("common.select")} options={reasonOptions} error={er.reasonCode?.message} {...form.register("reasonCode")} />
                <Textarea label={t("verification.notes")} optionalLabel={t("common.optional")} rows={3} hint={t("verification.notesHint")} error={er.notes?.message} {...form.register("notes")} />
                <Button type="submit" loading={decide.isPending} variant={outcome === "rejected" ? "danger" : "primary"}>
                  {t("verification.recordDecision")}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
      <EvidenceViewer doc={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
