"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CopyCheck, Pencil, Send } from "lucide-react";
import { useI18n } from "@/i18n";
import { ApiError, api, applyFieldErrors } from "@/lib/api";
import { useApi, useMe } from "@/lib/hooks";
import { hasRole } from "@/lib/roles";
import { normalisePhone, TZ_PHONE_RE } from "@/lib/format";
import type { ItemResponse, RiderDetail } from "@/lib/types";
import { Badge, Button, Card, Drawer, ErrorState, Input, Skeleton, StatusPill, TabPanel, Tabs, useToast } from "@/components/ui";
import { CompletenessRing } from "@/components/common/CompletenessRing";
import {
  ConsentsSection,
  CorrectionRequestForm,
  DisclosuresSection,
  DocumentsSection,
  HistorySection,
  MembershipsSection,
  OverviewSection,
  VehiclesSection,
  VerificationSection,
  invalidateRider,
} from "@/components/rider/sections";

const TABS = ["overview", "vehicles", "memberships", "verification", "documents", "consents", "history"] as const;

export default function RiderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, tx } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const me = useMe();
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [corrOpen, setCorrOpen] = useState(false);
  const q = useApi<ItemResponse<RiderDetail>>(`/riders/${id}`);

  const isAdminish = hasRole(me.data, "platform_admin", "association_admin", "verifier");
  const canWrite = hasRole(me.data, "platform_admin", "association_admin", "field_agent");

  const submit = useMutation({
    mutationFn: () => api(`/riders/${id}/submit`, { method: "POST" }),
    onSuccess: () => {
      toast.success(t("rider.submitted"));
      invalidateRider(qc, id);
    },
    onError: (e) => toast.error(e),
  });

  if (q.isPending)
    return (
      <div className="grid grid-cols-1 gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-40 w-full rounded-[20px]" />
        <Skeleton className="h-80 w-full rounded-[20px]" />
      </div>
    );
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;

  const r = q.data.data;
  const dup = r.duplicateFlag && (typeof r.duplicateFlag === "boolean" ? r.duplicateFlag : r.duplicateFlag.status !== "not_duplicate");
  const idBase = `rider-${id}`;
  const tabs = r.limitedView ? (["overview"] as const) : TABS;
  const counts: Partial<Record<(typeof TABS)[number], number>> = {
    vehicles: r.vehicles?.length,
    verification: r.verificationCases?.length,
    documents: r.documents?.length,
  };

  return (
    <div>
      <Link href="/riders" className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {t("roster.title")}
      </Link>

      <Card className="mb-4 p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <CompletenessRing percent={r.completeness?.percent ?? 0} size={96} label={t("rider.completeness")} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink sm:text-[28px]">{r.legalName}</h1>
              <StatusPill status={r.profileStatus} />
              {dup && (
                <Badge tone="warning" icon={<CopyCheck className="size-3.5" aria-hidden />}>
                  {t("roster.possibleDuplicate")}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              <span className="font-mono font-semibold text-ink">{r.systemId}</span>
              {r.preferredName ? ` · “${r.preferredName}”` : ""} · {r.phoneMasked ?? r.phoneE164 ?? ""}
            </p>
            <p className="mt-2 text-sm text-muted">{tx(`statusExplainStaff.${r.profileStatus}`, "")}</p>
            {r.limitedView && <p className="mt-2 rounded-[12px] bg-info-50 px-3 py-2 text-sm text-info-900">{t("rider.limitedView")}</p>}
            {!!r.completeness?.missing?.length && (
              <p className="mt-2 text-sm text-amber-900">
                <strong>{t("riderHome.missingTitle")}</strong> {r.completeness.missing.map((m) => tx(`missing.${m}`, m)).join(", ")}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-col">
            {canWrite && (r.profileStatus === "draft" || r.profileStatus === "correction_required") && (
              <Button onClick={() => submit.mutate()} loading={submit.isPending} icon={<Send className="size-4" aria-hidden />}>
                {t("rider.submitForVerification")}
              </Button>
            )}
            {canWrite && (
              <Button variant="secondary" onClick={() => setEditOpen(true)} icon={<Pencil className="size-4" aria-hidden />}>
                {t("rider.editContact")}
              </Button>
            )}
            {!r.limitedView && (
              <Button variant="ghost" onClick={() => setCorrOpen(true)}>
                {t("support.newCorrection")}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6">
        <Tabs
          idBase={idBase}
          value={tab}
          onChange={(k) => setTab(k as (typeof TABS)[number])}
          items={tabs.map((k) => ({ key: k, label: t(`riderTabs.${k}` as "riderTabs.overview"), count: counts[k] }))}
        />
        <TabPanel idBase={idBase} tabKey={tab}>
          {tab === "overview" && <OverviewSection rider={r} />}
          {tab === "vehicles" && <VehiclesSection rider={r} canLink={canWrite} />}
          {tab === "memberships" && <MembershipsSection rider={r} canManage={canWrite} />}
          {tab === "verification" && <VerificationSection rider={r} />}
          {tab === "documents" && <DocumentsSection rider={r} canUpload={canWrite || hasRole(me.data, "verifier")} />}
          {tab === "consents" && (
            <div className="grid grid-cols-1 gap-6">
              <section>
                <h3 className="mb-3 text-sm font-bold">{t("consent.title")}</h3>
                <ConsentsSection riderId={r.id} consents={r.consents} canWithdraw={isAdminish} />
              </section>
              <section>
                <h3 className="mb-3 text-sm font-bold">{t("disclosure.title")}</h3>
                <DisclosuresSection personId={r.id} canRecord={hasRole(me.data, "platform_admin")} />
              </section>
            </div>
          )}
          {tab === "history" && <HistorySection rider={r} />}
        </TabPanel>
      </Card>

      <EditContactDrawer open={editOpen} onClose={() => setEditOpen(false)} rider={r} canEditProtected={isAdminish} />
      <Drawer open={corrOpen} onClose={() => setCorrOpen(false)} title={t("support.newCorrection")} description={t("correction.intro")}>
        <CorrectionRequestForm riderId={r.id} onDone={() => setCorrOpen(false)} />
      </Drawer>
    </div>
  );
}

function EditContactDrawer({ open, onClose, rider, canEditProtected }: { open: boolean; onClose: () => void; rider: RiderDetail; canEditProtected: boolean }) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const schema = z.object({
    preferredName: z.string().trim().max(80).optional(),
    phoneNumber: z
      .string()
      .trim()
      .optional()
      .refine((v) => !v || TZ_PHONE_RE.test(normalisePhone(v)), t("login.phoneInvalid")),
    legalName: z.string().trim().optional(),
    identityReference: z.string().trim().optional(),
    dateOfBirth: z.string().optional(),
  });
  type V = z.infer<typeof schema>;
  const form = useForm<V>({
    resolver: zodResolver(schema),
    values: {
      preferredName: rider.preferredName ?? "",
      phoneNumber: rider.phoneE164 ?? "",
      legalName: rider.legalName,
      identityReference: "",
      dateOfBirth: rider.dateOfBirth ?? "",
    },
  });
  const m = useMutation({
    mutationFn: (v: V) => {
      const dirty = form.formState.dirtyFields;
      const body: Record<string, string> = {};
      if (dirty.preferredName) body.preferredName = v.preferredName ?? "";
      if (dirty.phoneNumber && v.phoneNumber) body.phoneNumber = normalisePhone(v.phoneNumber);
      if (canEditProtected) {
        if (dirty.legalName && v.legalName) body.legalName = v.legalName;
        if (dirty.identityReference && v.identityReference) body.identityReference = v.identityReference;
        if (dirty.dateOfBirth && v.dateOfBirth) body.dateOfBirth = v.dateOfBirth;
      }
      return api(`/riders/${rider.id}`, { method: "PATCH", body });
    },
    onSuccess: () => {
      toast.success(t("common.saved"));
      invalidateRider(qc, rider.id);
      onClose();
    },
    onError: (e) => {
      applyFieldErrors(e, form.setError);
      toast.error(e, e instanceof ApiError && e.code === "BUSINESS_RULE" ? t("rider.protectedField") : undefined);
    },
  });
  const er = form.formState.errors;
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("rider.editContact")}
      description={canEditProtected ? t("rider.editHintAdmin") : t("rider.editHint")}
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
        <Input label={t("rider.preferredName")} error={er.preferredName?.message} {...form.register("preferredName")} />
        <Input label={t("rider.phone")} type="tel" error={er.phoneNumber?.message} {...form.register("phoneNumber")} />
        {canEditProtected && (
          <div className="grid grid-cols-1 gap-4 rounded-[16px] border border-amber/40 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">{t("rider.protectedFields")}</p>
            <Input label={t("rider.legalName")} error={er.legalName?.message} {...form.register("legalName")} />
            <Input label={t("rider.identityReference")} placeholder={rider.identityReference ?? ""} hint={t("rider.idReplaceHint")} error={er.identityReference?.message} {...form.register("identityReference")} />
            <Input label={t("rider.dob")} type="date" error={er.dateOfBirth?.message} {...form.register("dateOfBirth")} />
          </div>
        )}
      </form>
    </Drawer>
  );
}
