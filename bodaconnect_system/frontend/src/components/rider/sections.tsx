"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, Link2, Motorbike, Plus, Upload } from "lucide-react";
import { useI18n } from "@/i18n";
import { ApiError, api, applyFieldErrors, downloadFile } from "@/lib/api";
import { useApi, useIdempotencyKey, useLookups } from "@/lib/hooks";
import { useGroups } from "@/lib/orgs";
import { formatBytes, formatDate, formatDateTime, humanize, toOptions } from "@/lib/format";
import type { Consent, Disclosure, ID, ListResponse, RiderDetail } from "@/lib/types";
import {
  Badge,
  Button,
  ButtonLink,
  ConfirmModal,
  DefinitionList,
  Drawer,
  EmptyState,
  Input,
  Select,
  SkeletonRows,
  StatusPill,
  Table,
  TD,
  TH,
  THead,
  TR,
  Textarea,
  useToast,
} from "@/components/ui";

export function invalidateRider(qc: ReturnType<typeof useQueryClient>, id: ID) {
  qc.invalidateQueries({ queryKey: [`/riders/${id}`] });
  qc.invalidateQueries({ queryKey: ["/riders"] });
}

export function OverviewSection({ rider }: { rider: RiderDetail }) {
  const { t, tx, lang } = useI18n();
  return (
    <DefinitionList
      items={[
        { label: t("rider.legalName"), value: rider.legalName },
        { label: t("rider.preferredName"), value: rider.preferredName || "-" },
        { label: t("rider.systemId"), value: <span className="font-mono">{rider.systemId}</span> },
        { label: t("rider.phone"), value: rider.phoneE164 ?? rider.phoneMasked ?? "-" },
        { label: t("rider.dob"), value: formatDate(rider.dateOfBirth, lang) },
        { label: t("rider.gender"), value: rider.gender ? tx(`gender.${rider.gender}`, humanize(rider.gender)) : "-" },
        { label: t("rider.identityReference"), value: rider.identityReference || rider.identityReferenceMasked || "-" },
        { label: t("rider.captureMethod"), value: rider.captureMethod ? tx(`capture.${rider.captureMethod}`, humanize(rider.captureMethod)) : "-" },
        { label: t("rider.organisation"), value: rider.organisationName ?? rider.memberships?.[0]?.organisationName ?? "-" },
        { label: t("rider.group"), value: rider.groupName ?? rider.groupMemberships?.find((g) => !g.endAt)?.groupName ?? "-" },
        { label: t("rider.parkingPoint"), value: rider.parkingPointName ?? rider.groupMemberships?.find((g) => !g.endAt)?.parkingPointName ?? "-" },
        { label: t("roster.registered"), value: formatDateTime(rider.createdAt, lang) },
      ]}
    />
  );
}

export function VehiclesSection({ rider, canLink }: { rider: RiderDetail; canLink?: boolean }) {
  const { t, tx } = useI18n();
  const vehicles = rider.vehicles ?? [];
  return (
    <div>
      {canLink && (
        <div className="mb-4 flex flex-wrap gap-2">
          <ButtonLink href={`/vehicles/new?personId=${rider.id}`} size="sm" icon={<Plus className="size-4" aria-hidden />}>
            {t("vehicle.addForRider")}
          </ButtonLink>
          <ButtonLink href={`/vehicles?linkPerson=${rider.id}`} size="sm" variant="secondary" icon={<Link2 className="size-4" aria-hidden />}>
            {t("vehicle.linkExisting")}
          </ButtonLink>
        </div>
      )}
      {vehicles.length ? (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {vehicles.map((v) => (
            <li key={v.id}>
              <Link href={`/vehicles/${v.id}`} className="flex items-start gap-3 rounded-[16px] border border-line p-4 hover:border-brand">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint-50 text-forest">
                  <Motorbike className="size-5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="font-mono font-bold text-ink">{v.registrationNumber}</p>
                  <p className="text-sm text-muted">
                    {tx(`vehicleType.${v.vehicleType}`, v.vehicleType)}
                    {v.make ? ` · ${v.make}` : ""}
                    {v.model ? ` ${v.model}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(v.relationship?.relationshipType ?? v.relationshipType) && (
                      <Badge tone="brand">{tx(`relationship.${v.relationship?.relationshipType ?? v.relationshipType}`, String(v.relationship?.relationshipType ?? v.relationshipType))}</Badge>
                    )}
                    {(v.verificationStatus || v.status) && <StatusPill status={v.verificationStatus ?? v.status} />}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={t("vehicle.none")} description={t("vehicle.noneHint")} />
      )}
    </div>
  );
}

export function MembershipsSection({ rider, canManage }: { rider: RiderDetail; canManage?: boolean }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const idem = useIdempotencyKey();
  const [open, setOpen] = useState(false);
  const [groupId, setGroupId] = useState("");
  const [ending, setEnding] = useState<ID | null>(null);
  const orgId = rider.memberships?.find((m) => !m.endAt)?.organisationId ?? rider.memberships?.[0]?.organisationId;
  const groups = useGroups(open ? orgId : null);

  const add = useMutation({
    mutationFn: () => api(`/groups/${groupId}/memberships`, { method: "POST", body: { personId: rider.id }, idempotencyKey: idem.get() }),
    onSuccess: () => {
      idem.reset();
      setOpen(false);
      toast.success(t("membership.added"));
      invalidateRider(qc, rider.id);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.isDefinitive) idem.reset();
      toast.error(e, e instanceof ApiError && e.status === 409 ? t("membership.alreadyActive") : undefined);
    },
  });
  const end = useMutation({
    mutationFn: (id: ID) => api(`/group-memberships/${id}/end`, { method: "POST" }),
    onSuccess: () => {
      setEnding(null);
      toast.success(t("membership.ended"));
      invalidateRider(qc, rider.id);
    },
    onError: (e) => toast.error(e),
  });

  return (
    <div className="grid grid-cols-1 gap-6">
      <section>
        <h3 className="mb-3 text-sm font-bold text-ink">{t("membership.association")}</h3>
        {rider.memberships?.length ? (
          <ul className="grid grid-cols-1 gap-2">
            {rider.memberships.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-line p-4">
                <div>
                  <p className="font-semibold text-ink">{m.organisationName ?? "-"}</p>
                  <p className="text-sm text-muted">
                    {m.membershipNumber ? `${m.membershipNumber} · ` : ""}
                    {formatDate(m.startAt, lang)} → {m.endAt ? formatDate(m.endAt, lang) : t("membership.present")}
                  </p>
                </div>
                <StatusPill status={m.endAt ? "ended" : (m.status ?? "active")} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">{t("riderHome.noMembership")}</p>
        )}
      </section>
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-ink">{t("membership.groups")}</h3>
          {canManage && (
            <Button size="sm" variant="secondary" icon={<Plus className="size-4" aria-hidden />} onClick={() => setOpen(true)}>
              {t("membership.addGroup")}
            </Button>
          )}
        </div>
        {rider.groupMemberships?.length ? (
          <ol className="relative ml-2 border-l-2 border-line pl-5">
            {rider.groupMemberships.map((g) => (
              <li key={g.id} className="relative mb-4 last:mb-0">
                <span className={`absolute -left-[27px] top-1.5 size-3 rounded-full ring-4 ring-white ${g.endAt ? "bg-line" : "bg-brand"}`} aria-hidden />
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-ink">{g.groupName ?? "-"}</p>
                    <p className="text-sm text-muted">
                      {g.parkingPointName ? `${g.parkingPointName} · ` : ""}
                      {formatDate(g.startAt, lang)} → {g.endAt ? formatDate(g.endAt, lang) : t("membership.present")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={g.endAt ? "ended" : "active"} />
                    {canManage && !g.endAt && (
                      <Button size="sm" variant="ghost" onClick={() => setEnding(g.id)}>
                        {t("membership.end")}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted">{t("riderHome.noGroup")}</p>
        )}
      </section>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t("membership.addGroup")}
        description={t("membership.addGroupHint")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={() => add.mutate()} disabled={!groupId} loading={add.isPending}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <Select
          label={t("rider.group")}
          required
          placeholder={groups.isFetching ? t("common.loading") : t("common.select")}
          options={(groups.data?.data ?? []).map((g) => ({ value: String(g.id), label: g.name }))}
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
        />
      </Drawer>
      <ConfirmModal
        open={ending !== null}
        onClose={() => setEnding(null)}
        onConfirm={() => ending !== null && end.mutate(ending)}
        loading={end.isPending}
        title={t("membership.endTitle")}
        description={t("membership.endBody")}
        confirmLabel={t("membership.end")}
        tone="danger"
      />
    </div>
  );
}

export function VerificationSection({ rider }: { rider: RiderDetail }) {
  const { t, tx, lang } = useI18n();
  const cases = rider.verificationCases ?? [];
  if (!cases.length) return <EmptyState title={t("verification.noCases")} description={t("verification.noCasesHint")} />;
  return (
    <ul className="grid grid-cols-1 gap-2">
      {cases.map((c) => (
        <li key={c.id}>
          <Link href={`/verification/${c.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-line p-4 hover:border-brand">
            <div>
              <p className="font-semibold text-ink">{tx(`verificationType.${c.verificationType}`, humanize(c.verificationType))}</p>
              <p className="text-sm text-muted">
                {t("verification.opened")}: {formatDateTime(c.createdAt, lang)}
                {c.decidedAt ? ` · ${t("verification.decided")}: ${formatDateTime(c.decidedAt, lang)}` : ""}
              </p>
            </div>
            <StatusPill status={c.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = ["application/pdf", "image/jpeg", "image/png"];

export function DocumentsSection({ rider, canUpload }: { rider: RiderDetail; canUpload?: boolean }) {
  const { t, tx, lang } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const lookups = useLookups();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("national_id");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<ID | null>(null);
  const idem = useIdempotencyKey();

  const docTypes = toOptions(lookups.data?.documentTypes, lang);
  const typeOptions = docTypes.length
    ? docTypes
    : ["national_id", "driving_licence", "vehicle_registration", "membership_letter", "other"].map((v) => ({ value: v, label: tx(`documentType.${v}`, humanize(v)) }));

  const upload = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append("file", file!);
      fd.append("documentType", docType);
      return api(`/riders/${rider.id}/documents`, { method: "POST", form: fd, idempotencyKey: idem.get() });
    },
    onSuccess: () => {
      idem.reset();
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success(t("documents.uploaded"));
      invalidateRider(qc, rider.id);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.isDefinitive) idem.reset();
      if (e instanceof ApiError && e.fieldErrors.file) setFileError(e.fieldErrors.file);
      toast.error(e, t("documents.uploadFailed"));
    },
  });

  const onPick = (f: File | null) => {
    setFileError(null);
    if (!f) return setFile(null);
    if (!ACCEPT.includes(f.type)) return setFileError(t("documents.badType"));
    if (f.size > MAX_BYTES) return setFileError(t("documents.tooLarge"));
    setFile(f);
  };

  const download = async (id: ID, name: string) => {
    setDownloading(id);
    try {
      await downloadFile(`/documents/${id}/download`, name);
    } catch (e) {
      toast.error(e, t("documents.downloadFailed"));
    } finally {
      setDownloading(null);
    }
  };

  const docs = rider.documents ?? [];
  return (
    <div className="grid grid-cols-1 gap-5">
      {canUpload && (
        <form
          className="grid grid-cols-1 gap-3 rounded-[16px] border border-dashed border-line bg-surface p-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            if (file) upload.mutate();
            else setFileError(t("documents.chooseFile"));
          }}
        >
          <Select label={t("documents.type")} options={typeOptions} value={docType} onChange={(e) => setDocType(e.target.value)} />
          <Input
            ref={fileRef}
            label={t("documents.file")}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            hint={t("documents.fileHint")}
            error={fileError ?? undefined}
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
            className="py-2 file:mr-3 file:rounded-full file:border-0 file:bg-mint file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-forest"
          />
          <Button type="submit" loading={upload.isPending} icon={<Upload className="size-4" aria-hidden />}>
            {t("documents.upload")}
          </Button>
        </form>
      )}
      {docs.length ? (
        <ul className="grid grid-cols-1 gap-2">
          {docs.map((d) => {
            const name = d.originalName ?? d.fileName ?? `${d.documentType}-${d.id}`;
            return (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-line p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint-50 text-forest">
                    <FileText className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{tx(`documentType.${d.documentType}`, humanize(d.documentType))}</p>
                    <p className="truncate text-sm text-muted">
                      {name} · {formatBytes(d.sizeBytes)} · {formatDateTime(d.createdAt, lang)}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" loading={downloading === d.id} icon={<Download className="size-4" aria-hidden />} onClick={() => download(d.id, name)}>
                  {t("documents.download")}
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title={t("documents.none")} description={t("documents.noneHint")} />
      )}
      <p className="text-xs text-muted">{t("documents.privacyNote")}</p>
    </div>
  );
}

export function ConsentsSection({ riderId, consents, canWithdraw }: { riderId: ID; consents?: Consent[]; canWithdraw?: boolean }) {
  const { t, tx, lang } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const [withdrawing, setWithdrawing] = useState<Consent | null>(null);
  const live = useApi<ListResponse<Consent> | { data: Consent[] }>(consents ? null : `/riders/${riderId}/consents`);
  const items = consents ?? live.data?.data ?? [];
  const withdraw = useMutation({
    mutationFn: (c: Consent) => api(`/riders/${riderId}/consents/${c.id}/withdraw`, { method: "POST" }),
    onSuccess: () => {
      setWithdrawing(null);
      toast.success(t("consent.withdrawn"));
      invalidateRider(qc, riderId);
      qc.invalidateQueries({ queryKey: [`/riders/${riderId}/consents`] });
    },
    onError: (e) => toast.error(e),
  });
  if (!consents && live.isPending) return <SkeletonRows rows={3} />;
  if (!items.length) return <EmptyState title={t("consent.none")} />;
  return (
    <>
      <ul className="grid grid-cols-1 gap-2">
        {items.map((c) => {
          const status = c.withdrawnAt ? "withdrawn" : c.granted ? "granted" : "withdrawn";
          return (
            <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-line p-4">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{c.purposeLabel ?? tx(`consent.${c.purpose}`, humanize(c.purpose))}</p>
                <p className="text-sm text-muted">
                  {t("privacy.version")} {c.noticeVersion ?? c.privacyNoticeVersion ?? "-"} · {formatDateTime(c.grantedAt ?? c.recordedAt ?? c.createdAt, lang)}
                  {c.withdrawnAt ? ` · ${t("consent.withdrawnOn", { date: formatDateTime(c.withdrawnAt, lang) })}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={status} />
                {canWithdraw && status === "granted" && (
                  <Button size="sm" variant="ghost" onClick={() => setWithdrawing(c)}>
                    {t("consent.withdraw")}
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <ConfirmModal
        open={withdrawing !== null}
        onClose={() => setWithdrawing(null)}
        onConfirm={() => withdrawing && withdraw.mutate(withdrawing)}
        loading={withdraw.isPending}
        tone="danger"
        title={t("consent.withdrawTitle")}
        description={t("consent.withdrawBody")}
        confirmLabel={t("consent.withdraw")}
      />
    </>
  );
}

export function DisclosuresSection({ personId, canRecord }: { personId: ID; canRecord?: boolean }) {
  const { t, lang } = useI18n();
  const q = useApi<ListResponse<Disclosure>>("/privacy/disclosures", { subjectPersonId: personId });
  const [open, setOpen] = useState(false);
  return (
    <div>
      {canRecord && (
        <div className="mb-3">
          <Button size="sm" variant="secondary" icon={<Plus className="size-4" aria-hidden />} onClick={() => setOpen(true)}>
            {t("disclosure.record")}
          </Button>
        </div>
      )}
      {q.isPending ? (
        <SkeletonRows rows={2} />
      ) : !q.data?.data?.length ? (
        <p className="text-sm text-muted">{t("disclosure.none")}</p>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>{t("disclosure.recipient")}</TH>
              <TH>{t("disclosure.purpose")}</TH>
              <TH>{t("disclosure.categories")}</TH>
              <TH>{t("disclosure.legalBasis")}</TH>
              <TH>{t("disclosure.date")}</TH>
            </tr>
          </THead>
          <tbody>
            {q.data.data.map((d) => (
              <TR key={d.id}>
                <TD className="font-semibold">{d.recipientOrgName ?? d.recipientOrgId ?? "-"}</TD>
                <TD>{d.purpose}</TD>
                <TD>{(d.dataCategories ?? []).join(", ")}</TD>
                <TD>{d.legalBasis}</TD>
                <TD className="whitespace-nowrap">
                  {formatDate(d.createdAt, lang)}
                  {d.expiryAt && <span className="block text-xs text-muted">{t("disclosure.expires", { date: formatDate(d.expiryAt, lang) })}</span>}
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
      {canRecord && <DisclosureDrawer open={open} onClose={() => setOpen(false)} personId={personId} />}
    </div>
  );
}

function DisclosureDrawer({ open, onClose, personId }: { open: boolean; onClose: () => void; personId: ID }) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const idem = useIdempotencyKey();
  const orgs = useApi<ListResponse<{ id: ID; name: string }>>(open ? "/organisations" : null, { perPage: 100 });
  const schema = z.object({
    recipientOrgId: z.string().min(1, t("validation.required")),
    purpose: z.string().trim().min(10, t("validation.purpose")),
    dataCategories: z.string().trim().min(1, t("validation.required")),
    legalBasis: z.string().trim().min(3, t("validation.required")),
    expiryAt: z.string().optional(),
  });
  type V = z.infer<typeof schema>;
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { recipientOrgId: "", purpose: "", dataCategories: "", legalBasis: "", expiryAt: "" } });
  const m = useMutation({
    mutationFn: (v: V) =>
      api("/privacy/disclosures", {
        method: "POST",
        idempotencyKey: idem.get(),
        body: {
          subjectPersonId: personId,
          recipientOrgId: v.recipientOrgId,
          purpose: v.purpose,
          dataCategories: v.dataCategories.split(",").map((s) => s.trim()).filter(Boolean),
          legalBasis: v.legalBasis,
          expiryAt: v.expiryAt || undefined,
        },
      }),
    onSuccess: () => {
      idem.reset();
      toast.success(t("disclosure.recorded"));
      qc.invalidateQueries({ queryKey: ["/privacy/disclosures"] });
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
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("disclosure.record")}
      description={t("disclosure.recordHint")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={form.handleSubmit((v) => m.mutate(v))} loading={m.isPending}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4" onSubmit={form.handleSubmit((v) => m.mutate(v))} noValidate>
        <Select label={t("disclosure.recipient")} required placeholder={t("common.select")} options={(orgs.data?.data ?? []).map((o) => ({ value: String(o.id), label: o.name }))} error={er.recipientOrgId?.message} {...form.register("recipientOrgId")} />
        <Textarea label={t("disclosure.purpose")} required rows={3} error={er.purpose?.message} {...form.register("purpose")} />
        <Input label={t("disclosure.categories")} required hint={t("disclosure.categoriesHint")} error={er.dataCategories?.message} {...form.register("dataCategories")} />
        <Input label={t("disclosure.legalBasis")} required error={er.legalBasis?.message} {...form.register("legalBasis")} />
        <Input label={t("disclosure.expiry")} type="date" optionalLabel={t("common.optional")} {...form.register("expiryAt")} />
      </form>
    </Drawer>
  );
}

export function HistorySection({ rider }: { rider: RiderDetail }) {
  const { t, tx, lang } = useI18n();
  const items = rider.timeline ?? [];
  if (!items.length) return <EmptyState title={t("history.none")} />;
  return (
    <ol className="relative ml-2 border-l-2 border-line pl-5">
      {items.map((e, i) => (
        <li key={e.id ?? i} className="relative mb-5 last:mb-0">
          <span className="absolute -left-[27px] top-1.5 size-3 rounded-full bg-forest ring-4 ring-white" aria-hidden />
          <p className="text-sm font-semibold text-ink">{e.summary ?? tx(`audit.${e.action}`, humanize(e.action))}</p>
          <p className="text-xs text-muted">
            {e.actorName ?? t("common.system")} · {formatDateTime(e.at ?? e.createdAt, lang)}
          </p>
        </li>
      ))}
    </ol>
  );
}

const CORRECTABLE = ["legalName", "preferredName", "phoneNumber", "dateOfBirth", "identityReference", "gender", "group", "parkingPoint", "vehicle", "other"];

export function CorrectionRequestForm({ riderId, onDone }: { riderId: ID; onDone?: () => void }) {
  const { t, tx } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const idem = useIdempotencyKey();
  const schema = z.object({
    field: z.string().min(1, t("validation.required")),
    proposedValue: z.string().trim().min(1, t("validation.required")).max(255),
    reason: z.string().trim().min(5, t("validation.reason")).max(1000),
  });
  type V = z.infer<typeof schema>;
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { field: "", proposedValue: "", reason: "" } });
  const m = useMutation({
    mutationFn: (v: V) => api(`/riders/${riderId}/correction-requests`, { method: "POST", body: v, idempotencyKey: idem.get() }),
    onSuccess: () => {
      idem.reset();
      form.reset();
      toast.success(t("correction.sent"), t("correction.sentBody"));
      qc.invalidateQueries({ queryKey: ["/support-requests"] });
      onDone?.();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.isDefinitive) idem.reset();
      applyFieldErrors(e, form.setError);
      toast.error(e);
    },
  });
  const er = form.formState.errors;
  return (
    <form className="grid grid-cols-1 gap-4" onSubmit={form.handleSubmit((v) => m.mutate(v))} noValidate>
      <Select
        label={t("correction.field")}
        required
        placeholder={t("common.select")}
        options={CORRECTABLE.map((f) => ({ value: f, label: tx(`field.${f}`, humanize(f)) }))}
        error={er.field?.message}
        {...form.register("field")}
      />
      <Input label={t("correction.proposed")} required error={er.proposedValue?.message} {...form.register("proposedValue")} />
      <Textarea label={t("correction.reason")} required rows={3} hint={t("correction.reasonHint")} error={er.reason?.message} {...form.register("reason")} />
      <div>
        <Button type="submit" loading={m.isPending}>
          {t("correction.submit")}
        </Button>
      </div>
    </form>
  );
}
