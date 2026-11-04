"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileSpreadsheet, ShieldAlert } from "lucide-react";
import { useI18n } from "@/i18n";
import { ApiError, api, applyFieldErrors, downloadFile } from "@/lib/api";
import { useApi, useIdempotencyKey, useMe } from "@/lib/hooks";
import { useGroups, useOrganisations } from "@/lib/orgs";
import { hasRole, primaryOrganisation } from "@/lib/roles";
import { formatDateTime, formatNumber, humanize } from "@/lib/format";
import type { ID, ListResponse, ReportExport, ReportType } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  ConfirmModal,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  SkeletonRows,
  StatusPill,
  Table,
  TD,
  TH,
  THead,
  TR,
  Textarea,
  cn,
  useToast,
} from "@/components/ui";

const STATUSES = ["draft", "submitted", "under_review", "verified", "correction_required", "rejected"];

function fieldLabel(f: ReportType["fields"][number]) {
  return typeof f === "string" ? f : (f.label ?? f.key);
}

function exportAvailable(e: ReportExport) {
  if (e.downloadAvailable !== undefined) return e.downloadAvailable;
  if (e.expiresAt) return new Date(e.expiresAt).getTime() > Date.now();
  return Date.now() - new Date(e.createdAt).getTime() < 15 * 60_000;
}

export default function ReportsPage() {
  const { t, tx, lang } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const me = useMe();
  const types = useApi<{ data: ReportType[] }>("/reports");
  const exportsQ = useApi<ListResponse<ReportExport>>("/reports/exports", { perPage: 20 });
  const orgs = useOrganisations();
  const idem = useIdempotencyKey();
  const [confirm, setConfirm] = useState(false);
  const [downloading, setDownloading] = useState<ID | null>(null);
  const isPlatform = hasRole(me.data, "platform_admin");

  const schema = z.object({
    reportType: z.string().min(1, t("reports.chooseReport")),
    purpose: z.string().trim().min(10, t("validation.purpose")).max(500),
    organisationId: z.string().optional(),
    groupId: z.string().optional(),
    status: z.string().optional(),
  });
  type V = z.infer<typeof schema>;
  const form = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: { reportType: "", purpose: "", organisationId: primaryOrganisation(me.data)?.id ? String(primaryOrganisation(me.data)!.id) : "", groupId: "", status: "" },
  });
  const v = useWatch({ control: form.control });
  const groups = useGroups(v.organisationId || null);
  const selected = types.data?.data.find((r) => r.key === v.reportType);
  const er = form.formState.errors;

  const create = useMutation({
    mutationFn: (val: V) =>
      api<{ data: ReportExport }>("/reports/exports", {
        method: "POST",
        idempotencyKey: idem.get(),
        body: {
          reportType: val.reportType,
          purpose: val.purpose.trim(),
          filters: { organisationId: val.organisationId || undefined, groupId: val.groupId || undefined, status: val.status || undefined },
        },
      }),
    onSuccess: async (res) => {
      idem.reset();
      setConfirm(false);
      toast.success(t("reports.created"), res?.data?.rowCount !== undefined && res?.data?.rowCount !== null ? t("reports.rows", { n: res.data.rowCount }) : undefined);
      form.reset({ ...form.getValues(), purpose: "" });
      await qc.invalidateQueries({ queryKey: ["/reports/exports"] });
    },
    onError: (e) => {
      setConfirm(false);
      if (e instanceof ApiError && e.isDefinitive) idem.reset();
      applyFieldErrors(e, form.setError);
      toast.error(e);
    },
  });

  const download = async (e: ReportExport) => {
    setDownloading(e.id);
    try {
      await downloadFile(`/reports/exports/${e.id}/download`, e.fileName ?? `${e.reportType}-${e.id}.csv`);
      qc.invalidateQueries({ queryKey: ["/reports/exports"] });
    } catch (err) {
      toast.error(err, t("reports.downloadFailed"));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <>
      <PageHeader eyebrow={t("reports.eyebrow")} title={t("reports.title")} description={t("reports.subtitle")} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardHeader title={t("reports.newExport")} />
          <CardBody>
            <form className="grid grid-cols-1 gap-5" onSubmit={form.handleSubmit(() => setConfirm(true))} noValidate>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold">
                  {t("reports.reportType")} <span className="text-danger">*</span>
                </legend>
                {types.isPending ? (
                  <SkeletonRows rows={3} />
                ) : types.isError ? (
                  <ErrorState error={types.error} onRetry={() => types.refetch()} />
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {types.data.data.map((r) => (
                      <label
                        key={r.key}
                        className={cn(
                          "flex min-h-11 cursor-pointer items-start gap-3 rounded-[16px] border-[1.5px] p-4 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/30",
                          v.reportType === r.key ? "border-brand bg-mint-50" : "border-line hover:border-muted/40",
                        )}
                      >
                        <input type="radio" value={r.key} className="sr-only" {...form.register("reportType")} />
                        <FileSpreadsheet className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />
                        <span>
                          <span className="block font-semibold text-ink">{tx(`report.${r.key}`, r.name)}</span>
                          {r.description && <span className="block text-sm text-muted">{r.description}</span>}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
                {er.reportType && <p className="mt-1 text-sm text-danger-900">{er.reportType.message}</p>}
              </fieldset>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {isPlatform && (
                  <Select label={t("rider.organisation")} placeholder={t("common.all")} options={(orgs.data?.data ?? []).map((o) => ({ value: String(o.id), label: o.name }))} {...form.register("organisationId")} />
                )}
                <Select label={t("rider.group")} placeholder={t("common.all")} options={(groups.data?.data ?? []).map((g) => ({ value: String(g.id), label: g.name }))} {...form.register("groupId")} />
                <Select label={t("common.status")} placeholder={t("common.all")} options={STATUSES.map((s) => ({ value: s, label: tx(`status.${s}`, s) }))} {...form.register("status")} />
              </div>

              {selected && (
                <div className="rounded-[16px] bg-surface p-4">
                  <p className="text-sm font-semibold text-ink">{t("reports.fieldsPreview")}</p>
                  <p className="mb-2 text-xs text-muted">{t("reports.fieldsPreviewHint")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.fields.map((f) => (
                      <Badge key={fieldLabel(f)}>{tx(`field.${fieldLabel(f)}`, humanize(fieldLabel(f)))}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Textarea label={t("reports.purpose")} required rows={3} hint={t("reports.purposeHint")} error={er.purpose?.message} {...form.register("purpose")} />
              <div>
                <Button type="submit" icon={<FileSpreadsheet className="size-4" aria-hidden />}>
                  {t("reports.generate")}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="self-start">
          <CardHeader title={t("reports.history")} description={t("reports.historyHint")} />
          <CardBody>
            {exportsQ.isPending ? (
              <SkeletonRows rows={3} />
            ) : exportsQ.isError ? (
              <ErrorState error={exportsQ.error} onRetry={() => exportsQ.refetch()} />
            ) : !exportsQ.data.data.length ? (
              <EmptyState title={t("reports.noExports")} />
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>{t("reports.reportType")}</TH>
                    <TH>{t("common.status")}</TH>
                    <TH>
                      <span className="sr-only">{t("common.actions")}</span>
                    </TH>
                  </tr>
                </THead>
                <tbody>
                  {exportsQ.data.data.map((e) => {
                    const ok = exportAvailable(e);
                    return (
                      <TR key={e.id}>
                        <TD>
                          <p className="font-semibold">{tx(`report.${e.reportType}`, humanize(e.reportType))}</p>
                          <p className="text-xs text-muted">
                            {formatDateTime(e.createdAt, lang)}
                            {e.rowCount !== null && e.rowCount !== undefined ? ` · ${t("reports.rows", { n: formatNumber(e.rowCount, lang) })}` : ""}
                          </p>
                          <p className="line-clamp-2 text-xs text-muted" title={e.purpose}>
                            {e.purpose}
                          </p>
                        </TD>
                        <TD>
                          <StatusPill status={ok ? "ready" : "expired"} />
                        </TD>
                        <TD>
                          <Button size="sm" variant="secondary" disabled={!ok} loading={downloading === e.id} onClick={() => download(e)} aria-label={`${t("documents.download")} ${humanize(e.reportType)}`}>
                            <Download className="size-4" aria-hidden />
                          </Button>
                        </TD>
                      </TR>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>

      <ConfirmModal
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => form.handleSubmit((val) => create.mutate(val))()}
        loading={create.isPending}
        title={t("reports.confirmTitle")}
        description={t("reports.confirmBody")}
        confirmLabel={t("reports.confirm")}
      >
        <div className="flex gap-3 rounded-[12px] bg-amber-50 p-3 text-sm">
          <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-900" aria-hidden />
          <div>
            <p className="font-semibold">{selected ? tx(`report.${selected.key}`, selected.name) : ""}</p>
            <p className="mt-1 text-muted">
              {t("reports.purpose")}: {v.purpose}
            </p>
          </div>
        </div>
      </ConfirmModal>
    </>
  );
}
