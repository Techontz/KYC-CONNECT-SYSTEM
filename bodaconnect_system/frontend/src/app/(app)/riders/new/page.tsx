"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, BadgeCheck, Bike, Info, Motorbike, Send, UserPlus } from "lucide-react";
import { useI18n, type MessageKey } from "@/i18n";
import { ApiError, api } from "@/lib/api";
import { useDebounced, useIdempotencyKey, useLookups, useMe } from "@/lib/hooks";
import { useGroups, useOrganisations, useParkingPoints } from "@/lib/orgs";
import { normalisePhone, normalisePlate, toOptions, TZ_PHONE_RE } from "@/lib/format";
import { hasRole, primaryOrganisation } from "@/lib/roles";
import type { DuplicateMatch, ItemResponse, RiderDetail } from "@/lib/types";
import {
  Button,
  ButtonLink,
  Card,
  Checkbox,
  ConfirmModal,
  DefinitionList,
  Input,
  PageHeader,
  RadioCard,
  Select,
  StatusPill,
  Stepper,
  useToast,
} from "@/components/ui";
import { DuplicateMatches } from "@/components/common/DuplicateMatches";
import { NoticeBody, useActiveNotice } from "@/components/common/PrivacyNotice";

/** v1.1: `registration` consent is required to create a rider. */
const REQUIRED_PURPOSES = ["registration"];
const FALLBACK_PURPOSES = [
  { value: "registration", label: "", required: true },
  { value: "association_membership", label: "", required: false },
  { value: "partner_services", label: "", required: false },
  { value: "sms_notifications", label: "", required: false },
];

const STEP_FIELDS: string[][] = [
  ["legalName", "preferredName", "phoneNumber", "dateOfBirth", "gender", "identityReference"],
  ["organisationId", "groupId", "parkingPointId"],
  ["addVehicle", "vehicle.vehicleType", "vehicle.registrationNumber", "vehicle.make", "vehicle.model", "vehicle.relationshipType"],
  ["noticeAcknowledged", "consents"],
  [],
];

function makeSchema(t: (k: MessageKey) => string) {
  return z
    .object({
      legalName: z.string().trim().min(3, t("validation.legalName")).max(150),
      preferredName: z.string().trim().max(80).optional(),
      phoneNumber: z
        .string()
        .trim()
        .min(1, t("validation.required"))
        .refine((v) => TZ_PHONE_RE.test(normalisePhone(v)), t("login.phoneInvalid")),
      dateOfBirth: z
        .string()
        .optional()
        .refine((v) => !v || new Date(v) < new Date(), t("validation.dobPast")),
      gender: z.string().optional(),
      identityReference: z.string().trim().max(40).optional(),
      organisationId: z.string().min(1, t("validation.organisation")),
      groupId: z.string().optional(),
      parkingPointId: z.string().optional(),
      addVehicle: z.boolean(),
      vehicle: z.object({
        vehicleType: z.string().optional(),
        registrationNumber: z.string().trim().optional(),
        make: z.string().optional(),
        model: z.string().optional(),
        relationshipType: z.string().optional(),
      }),
      noticeAcknowledged: z.boolean().refine((v) => v, t("validation.noticeAck")),
      consents: z.record(z.string(), z.boolean()),
    })
    .superRefine((v, ctx) => {
      if (!v.addVehicle) return;
      if (!v.vehicle.vehicleType) ctx.addIssue({ code: "custom", path: ["vehicle", "vehicleType"], message: t("validation.required") });
      if (!v.vehicle.registrationNumber || normalisePlate(v.vehicle.registrationNumber).length < 4)
        ctx.addIssue({ code: "custom", path: ["vehicle", "registrationNumber"], message: t("validation.plate") });
      if (!v.vehicle.relationshipType) ctx.addIssue({ code: "custom", path: ["vehicle", "relationshipType"], message: t("validation.relationship") });
    });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

export default function RegisterRiderPage() {
  const { t, tx, lang } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const me = useMe();
  const lookups = useLookups();
  const notice = useActiveNotice();
  const orgs = useOrganisations();
  const idem = useIdempotencyKey();
  const referIdem = useIdempotencyKey();
  const [step, setStep] = useState(0);
  const [created, setCreated] = useState<{ rider: RiderDetail; duplicates: DuplicateMatch[] } | null>(null);
  const [conflict, setConflict] = useState<DuplicateMatch[] | null>(null);
  const [referOpen, setReferOpen] = useState(false);

  const schema = useMemo(() => makeSchema(t), [t]);
  const defaultOrg = primaryOrganisation(me.data);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      legalName: "",
      preferredName: "",
      phoneNumber: "",
      dateOfBirth: "",
      gender: "",
      identityReference: "",
      organisationId: defaultOrg ? String(defaultOrg.id) : "",
      groupId: "",
      parkingPointId: "",
      addVehicle: false,
      vehicle: { vehicleType: "motorcycle", registrationNumber: "", make: "", model: "", relationshipType: "" },
      noticeAcknowledged: false,
      consents: {},
    },
  });
  const { register, control, setValue, getValues, formState } = form;
  const errors = formState.errors;
  const consentError = (errors.consents as { message?: string } | undefined)?.message;
  const values = useWatch({ control });

  // Default organisation once /me and /organisations load.
  useEffect(() => {
    if (getValues("organisationId")) return;
    const first = defaultOrg?.id ?? orgs.data?.data.find((o) => o.type === "association")?.id ?? orgs.data?.data[0]?.id;
    if (first) setValue("organisationId", String(first));
  }, [defaultOrg?.id, orgs.data, getValues, setValue]);

  const groups = useGroups(values.organisationId || null);
  const points = useParkingPoints(values.organisationId || null);

  const purposes = useMemo(() => {
    const fromApi = lookups.data?.consentPurposes ?? [];
    if (fromApi.length)
      return toOptions(fromApi, lang).map((o, i) => {
        const raw = fromApi[i];
        const flagged = typeof raw === "object" && raw !== null ? Boolean(raw.required) : false;
        return { ...o, required: flagged || REQUIRED_PURPOSES.includes(o.value) };
      });
    return FALLBACK_PURPOSES.map((p) => ({ ...p, label: tx(`consent.${p.value}`, p.value) }));
  }, [lookups.data, lang, tx]);

  // Live duplicate check (debounced).
  const dupInput = useDebounced(
    {
      phoneNumber: values.phoneNumber && TZ_PHONE_RE.test(normalisePhone(values.phoneNumber)) ? normalisePhone(values.phoneNumber) : undefined,
      identityReference: values.identityReference?.trim() || undefined,
      legalName: values.legalName && values.legalName.trim().length >= 5 ? values.legalName.trim() : undefined,
      registrationNumber: values.addVehicle && values.vehicle?.registrationNumber && normalisePlate(values.vehicle.registrationNumber).length >= 4 ? values.vehicle.registrationNumber : undefined,
    },
    600,
  );
  const hasDupInput = Object.values(dupInput).some(Boolean);
  const dupCheck = useQuery({
    queryKey: ["duplicate-check", dupInput],
    queryFn: () => api<ItemResponse<{ matches: DuplicateMatch[] }>>("/riders/duplicate-check", { method: "POST", body: dupInput }),
    enabled: hasDupInput && !created,
    staleTime: 60_000,
    retry: false,
  });
  const matches = dupCheck.data?.data?.matches ?? [];
  const phoneMatch = matches.some((m) => m.reason === "phone");

  const create = useMutation({
    mutationFn: (v: FormValues) => {
      const consents = purposes.map((p) => ({ purpose: p.value, granted: Boolean(v.consents[p.value]) }));
      const body = {
        legalName: v.legalName.trim(),
        preferredName: v.preferredName?.trim() || undefined,
        phoneNumber: normalisePhone(v.phoneNumber),
        dateOfBirth: v.dateOfBirth || undefined,
        gender: v.gender || undefined,
        identityReference: v.identityReference?.trim() || undefined,
        organisationId: v.organisationId,
        groupId: v.groupId || undefined,
        parkingPointId: v.parkingPointId || undefined,
        privacyNoticeVersion: notice.data?.version,
        captureMethod: hasRole(me.data, "rider") && !hasRole(me.data, "field_agent", "association_admin", "platform_admin") ? "self_registration" : "assisted_registration",
        consents,
        vehicle: v.addVehicle
          ? {
              vehicleType: v.vehicle.vehicleType,
              registrationNumber: v.vehicle.registrationNumber?.trim(),
              make: v.vehicle.make || undefined,
              model: v.vehicle.model || undefined,
              relationshipType: v.vehicle.relationshipType,
            }
          : undefined,
      };
      return api<{ data: RiderDetail; duplicates?: DuplicateMatch[] }>("/riders", { method: "POST", body, idempotencyKey: idem.get() });
    },
    onSuccess: (res) => {
      idem.reset();
      setCreated({ rider: res.data, duplicates: res.duplicates ?? [] });
      qc.invalidateQueries({ queryKey: ["/riders"] });
      qc.invalidateQueries({ queryKey: ["/dashboard/summary"] });
      window.scrollTo({ top: 0 });
    },
    onError: (err) => {
      if (err instanceof ApiError && err.isDefinitive) idem.reset();
      if (err instanceof ApiError && err.status === 409) {
        const m = (err.details?.matches as DuplicateMatch[] | undefined) ?? [];
        setConflict(m);
        setStep(0);
        return;
      }
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length) {
        let firstStep = 4;
        for (const [field, message] of Object.entries(err.fieldErrors)) {
          form.setError(field as keyof FormValues, { type: "server", message });
          const s = STEP_FIELDS.findIndex((fs) => fs.includes(field) || (field.startsWith("consents") && fs.includes("consents")));
          if (s >= 0) firstStep = Math.min(firstStep, s);
        }
        setStep(firstStep);
      }
      toast.error(err, t("register.failed"));
    },
  });

  const refer = useMutation({
    mutationFn: () => {
      const m = matches[0];
      return api("/support-requests", {
        method: "POST",
        idempotencyKey: referIdem.get(),
        body: {
          category: "help",
          subjectPersonId: m?.id,
          description: t("register.referDescription", { systemId: m?.systemId ?? "", reason: tx(`duplicateReason.${m?.reason}`, m?.reason ?? "") }),
        },
      });
    },
    onSuccess: () => {
      referIdem.reset();
      toast.success(t("register.referred"));
      router.push(matches[0] ? `/riders/${matches[0].id}` : "/riders");
    },
    onError: (e) => toast.error(e),
  });

  async function next() {
    const fields = STEP_FIELDS[step] as Parameters<typeof form.trigger>[0];
    const ok = await form.trigger(fields, { shouldFocus: true });
    if (!ok) return;
    if (step === 3) {
      const missing = purposes.filter((p) => p.required && !getValues(`consents.${p.value}`));
      if (missing.length) {
        form.setError("consents", { type: "required", message: t("validation.requiredConsent") });
        return;
      }
      form.clearErrors("consents");
    }
    setStep((s) => Math.min(4, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const steps = [t("register.step1"), t("register.step2"), t("register.step3"), t("register.step4"), t("register.step5")];
  const orgName = orgs.data?.data.find((o) => String(o.id) === values.organisationId)?.name;
  const groupName = groups.data?.data.find((g) => String(g.id) === values.groupId)?.name;
  const pointName = points.data?.data.find((p) => String(p.id) === values.parkingPointId)?.name;

  if (created) return <SuccessScreen rider={created.rider} duplicates={created.duplicates} onAnother={() => location.reload()} />;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow={t("register.eyebrow")} title={t("register.title")} description={t("register.subtitle")} />
      <Card className="p-5 sm:p-8">
        <Stepper steps={steps} current={step} label={t("register.progress")} />

        {conflict && (
          <DuplicateMatches
            className="mt-6"
            blocking
            matches={conflict.length ? conflict : matches}
            onStop={() => setReferOpen(true)}
          />
        )}

        <form
          className="mt-6"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 4) void next();
            else void form.handleSubmit((v) => create.mutate(v))();
          }}
        >
          {step === 0 && (
            <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <legend className="mb-4 text-lg font-bold">{t("register.step1")}</legend>
              <Input label={t("rider.legalName")} required autoComplete="name" hint={t("register.legalNameHint")} error={errors.legalName?.message} wrapperClassName="sm:col-span-2" {...register("legalName")} />
              <Input label={t("rider.preferredName")} optionalLabel={t("common.optional")} error={errors.preferredName?.message} {...register("preferredName")} />
              <Input label={t("rider.phone")} required type="tel" inputMode="tel" placeholder="0712 345 678" error={errors.phoneNumber?.message} {...register("phoneNumber")} />
              <Input label={t("rider.dob")} optionalLabel={t("common.optional")} type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
              <Select
                label={t("rider.gender")}
                optionalLabel={t("common.optional")}
                placeholder={t("common.select")}
                options={
                  lookups.data?.genders?.length
                    ? toOptions(lookups.data.genders, lang).map((o) => ({ ...o, label: tx(`gender.${o.value}`, o.label) }))
                    : ["male", "female", "other", "prefer_not_to_say"].map((g) => ({ value: g, label: tx(`gender.${g}`, g) }))
                }
                {...register("gender")}
              />
              <Input
                label={t("rider.identityReference")}
                optionalLabel={t("common.optional")}
                hint={t("register.idHint")}
                autoComplete="off"
                error={errors.identityReference?.message}
                wrapperClassName="sm:col-span-2"
                {...register("identityReference")}
              />
            </fieldset>
          )}

          {step === 1 && (
            <fieldset className="grid grid-cols-1 gap-4">
              <legend className="mb-4 text-lg font-bold">{t("register.step2")}</legend>
              <Select
                label={t("rider.organisation")}
                required
                placeholder={orgs.isPending ? t("common.loading") : t("common.select")}
                options={(orgs.data?.data ?? []).map((o) => ({ value: String(o.id), label: o.name }))}
                error={errors.organisationId?.message}
                {...register("organisationId", {
                  onChange: () => {
                    setValue("groupId", "");
                    setValue("parkingPointId", "");
                  },
                })}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  label={t("rider.group")}
                  optionalLabel={t("common.optional")}
                  placeholder={groups.isFetching ? t("common.loading") : t("common.select")}
                  options={(groups.data?.data ?? []).map((g) => ({ value: String(g.id), label: g.code ? `${g.name} (${g.code})` : g.name }))}
                  error={errors.groupId?.message}
                  disabled={!values.organisationId}
                  {...register("groupId")}
                />
                <Select
                  label={t("rider.parkingPoint")}
                  optionalLabel={t("common.optional")}
                  placeholder={points.isFetching ? t("common.loading") : t("common.select")}
                  options={(points.data?.data ?? []).map((p) => ({ value: String(p.id), label: p.ward ? `${p.name} · ${p.ward}` : p.name }))}
                  error={errors.parkingPointId?.message}
                  disabled={!values.organisationId}
                  {...register("parkingPointId")}
                />
              </div>
              <p className="flex items-start gap-2 rounded-[12px] bg-mint-50 p-3 text-sm text-ink">
                <Info className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden /> {t("register.groupHint")}
              </p>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset className="grid grid-cols-1 gap-4">
              <legend className="mb-4 text-lg font-bold">{t("register.step3")}</legend>
              <Checkbox label={t("register.addVehicle")} description={t("register.addVehicleDesc")} {...register("addVehicle")} />
              {values.addVehicle && (
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("vehicle.type")}>
                    {(["motorcycle", "bajaji"] as const).map((vt) => (
                      <RadioCard
                        key={vt}
                        value={vt}
                        checked={values.vehicle?.vehicleType === vt}
                        title={tx(`vehicleType.${vt}`, vt)}
                        icon={vt === "motorcycle" ? <Motorbike className="size-5" aria-hidden /> : <Bike className="size-5" aria-hidden />}
                        {...register("vehicle.vehicleType")}
                      />
                    ))}
                  </div>
                  {errors.vehicle?.vehicleType && <p className="text-sm text-danger-900">{errors.vehicle.vehicleType.message}</p>}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Input
                      label={t("vehicle.plate")}
                      required
                      placeholder="MC 123 ABC"
                      autoCapitalize="characters"
                      error={errors.vehicle?.registrationNumber?.message}
                      {...register("vehicle.registrationNumber")}
                    />
                    <Select
                      label={t("vehicle.make")}
                      optionalLabel={t("common.optional")}
                      placeholder={t("common.select")}
                      options={toOptions(lookups.data?.vehicleMakes, lang)}
                      {...register("vehicle.make")}
                    />
                    <Input label={t("vehicle.model")} optionalLabel={t("common.optional")} {...register("vehicle.model")} />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-semibold text-ink">
                      {t("vehicle.relationship")} <span className="text-danger">*</span>
                    </p>
                    <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label={t("vehicle.relationship")}>
                      {(["owner", "operator", "keeper"] as const).map((rt) => (
                        <RadioCard
                          key={rt}
                          value={rt}
                          checked={values.vehicle?.relationshipType === rt}
                          title={tx(`relationship.${rt}`, rt)}
                          description={tx(`relationshipDesc.${rt}`, "")}
                          {...register("vehicle.relationshipType")}
                        />
                      ))}
                    </div>
                    {errors.vehicle?.relationshipType && <p className="mt-1 text-sm text-danger-900">{errors.vehicle.relationshipType.message}</p>}
                    <p className="mt-3 flex items-start gap-2 rounded-[12px] bg-info-50 p-3 text-sm text-info-900">
                      <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("register.operatorNote")}
                    </p>
                  </div>
                </div>
              )}
              {!values.addVehicle && <p className="text-sm text-muted">{t("register.vehicleSkip")}</p>}
            </fieldset>
          )}

          {step === 3 && (
            <fieldset className="grid grid-cols-1 gap-4">
              <legend className="mb-4 text-lg font-bold">{t("register.step4")}</legend>
              <p className="text-sm text-muted">{t("register.noticeIntro")}</p>
              {notice.isPending ? (
                <p className="text-sm text-muted">{t("common.loading")}</p>
              ) : notice.data ? (
                <div>
                  <p className="mb-2 text-sm text-muted">
                    {t("privacy.version")}: <strong className="font-mono text-ink">{notice.data.version}</strong>
                  </p>
                  <div className="max-h-72 overflow-y-auto rounded-[12px] border border-line bg-surface p-4" tabIndex={0} aria-label={t("privacy.noticeTitle")}>
                    <NoticeBody content={notice.data.content} />
                  </div>
                </div>
              ) : (
                <p role="alert" className="text-sm text-danger-900">
                  {t("register.noticeUnavailable")}
                </p>
              )}
              <Checkbox label={t("register.noticeAck")} error={errors.noticeAcknowledged?.message} {...register("noticeAcknowledged")} />
              <div className="rounded-[16px] border border-line p-4">
                <p className="mb-1 text-sm font-bold text-ink">{t("register.consentsTitle")}</p>
                <p className="mb-2 text-[13px] text-muted">{t("register.consentsHint")}</p>
                {purposes.map((p) => (
                  <Checkbox
                    key={p.value}
                    label={
                      <>
                        {p.label}
                        {p.required && <span className="ml-1 text-xs font-semibold text-danger-900">({t("common.required")})</span>}
                      </>
                    }
                    description={tx(`consentDesc.${p.value}`, "")}
                    {...register(`consents.${p.value}` as const)}
                  />
                ))}
                {consentError && (
                  <p role="alert" className="mt-1 text-sm font-medium text-danger-900">
                    {consentError}
                  </p>
                )}
              </div>
            </fieldset>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 gap-5">
              <h2 className="text-lg font-bold">{t("register.step5")}</h2>
              <ReviewBlock title={t("register.step1")} onEdit={() => setStep(0)}>
                <DefinitionList
                  items={[
                    { label: t("rider.legalName"), value: values.legalName },
                    { label: t("rider.preferredName"), value: values.preferredName || "-" },
                    { label: t("rider.phone"), value: values.phoneNumber ? normalisePhone(values.phoneNumber) : "-" },
                    { label: t("rider.dob"), value: values.dateOfBirth || "-" },
                    { label: t("rider.gender"), value: values.gender ? tx(`gender.${values.gender}`, values.gender) : "-" },
                    { label: t("rider.identityReference"), value: values.identityReference || "-" },
                  ]}
                />
              </ReviewBlock>
              <ReviewBlock title={t("register.step2")} onEdit={() => setStep(1)}>
                <DefinitionList
                  items={[
                    { label: t("rider.organisation"), value: orgName ?? "-" },
                    { label: t("rider.group"), value: groupName ?? "-" },
                    { label: t("rider.parkingPoint"), value: pointName ?? "-" },
                  ]}
                />
              </ReviewBlock>
              <ReviewBlock title={t("register.step3")} onEdit={() => setStep(2)}>
                {values.addVehicle ? (
                  <DefinitionList
                    items={[
                      { label: t("vehicle.type"), value: tx(`vehicleType.${values.vehicle?.vehicleType}`, values.vehicle?.vehicleType ?? "-") },
                      { label: t("vehicle.plate"), value: values.vehicle?.registrationNumber?.toUpperCase() },
                      { label: t("vehicle.make"), value: values.vehicle?.make || "-" },
                      { label: t("vehicle.relationship"), value: tx(`relationship.${values.vehicle?.relationshipType}`, "-") },
                    ]}
                  />
                ) : (
                  <p className="text-sm text-muted">{t("register.noVehicle")}</p>
                )}
              </ReviewBlock>
              <ReviewBlock title={t("register.step4")} onEdit={() => setStep(3)}>
                <p className="text-sm text-ink">
                  {t("privacy.version")}: <strong className="font-mono">{notice.data?.version ?? "-"}</strong>
                </p>
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {purposes.map((p) => (
                    <li key={p.value} className="flex items-center gap-2">
                      <StatusPill status={values.consents?.[p.value] ? "granted" : "withdrawn"} /> {p.label}
                    </li>
                  ))}
                </ul>
              </ReviewBlock>
            </div>
          )}

          {!conflict && matches.length > 0 && (
            <DuplicateMatches className="mt-6" matches={matches} blocking={phoneMatch} onStop={() => setReferOpen(true)} />
          )}

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)} icon={<ArrowLeft className="size-4" aria-hidden />}>
                {t("common.back")}
              </Button>
            ) : (
              <ButtonLink href="/riders" variant="ghost">
                {t("common.cancel")}
              </ButtonLink>
            )}
            {step < 4 ? (
              <Button type="submit">
                {t("common.continue")} <ArrowRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button type="submit" loading={create.isPending} disabled={!notice.data} icon={<UserPlus className="size-4" aria-hidden />}>
                {t("register.submit")}
              </Button>
            )}
          </div>
        </form>
      </Card>

      <ConfirmModal
        open={referOpen}
        onClose={() => setReferOpen(false)}
        onConfirm={() => refer.mutate()}
        loading={refer.isPending}
        title={t("register.referTitle")}
        description={t("register.referBody")}
        confirmLabel={t("duplicates.stopAndRefer")}
      />
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <section className="rounded-[16px] border border-line p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-ink">{title}</h3>
        <button type="button" onClick={onEdit} className="min-h-11 rounded-full px-3 text-sm font-semibold text-forest hover:bg-mint-50">
          {t("common.edit")}
        </button>
      </div>
      {children}
    </section>
  );
}

function SuccessScreen({ rider, duplicates, onAnother }: { rider: RiderDetail; duplicates: DuplicateMatch[]; onAnother: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const [status, setStatus] = useState(rider.profileStatus);
  const submit = useMutation({
    mutationFn: () => api<ItemResponse<RiderDetail>>(`/riders/${rider.id}/submit`, { method: "POST" }),
    onSuccess: (res) => {
      setStatus(res?.data?.profileStatus ?? "submitted");
      qc.invalidateQueries({ queryKey: ["/riders"] });
      toast.success(t("rider.submitted"));
    },
    onError: (e) => toast.error(e),
  });
  return (
    <div className="mx-auto max-w-xl py-6 text-center">
      <div className="relative mx-auto mb-6 flex size-24 items-center justify-center rounded-full bg-mint">
        <BadgeCheck className="size-12 text-brand" aria-hidden />
      </div>
      <h1 className="text-[28px] font-extrabold tracking-[-0.02em]">{t("register.successTitle")}</h1>
      <p className="mt-2 text-muted">{t("register.successBody", { name: rider.legalName })}</p>
      <div className="mx-auto mt-6 inline-flex flex-col items-center gap-1 rounded-[20px] bg-white px-8 py-5 shadow-float ring-1 ring-line" role="status">
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">{t("rider.systemId")}</span>
        <span className="font-mono text-3xl font-extrabold tracking-wider text-ink select-all">{rider.systemId}</span>
        <StatusPill status={status} className="mt-1" />
      </div>
      {duplicates.length > 0 && (
        <div className="mt-6 text-left">
          <DuplicateMatches matches={duplicates} />
          <p className="mt-2 text-sm text-muted">{t("register.flaggedNote")}</p>
        </div>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {(status === "draft" || status === "correction_required") && (
          <Button onClick={() => submit.mutate()} loading={submit.isPending} icon={<Send className="size-4" aria-hidden />}>
            {t("rider.submitForVerification")}
          </Button>
        )}
        <ButtonLink href={`/riders/${rider.id}`} variant="secondary">
          {t("register.viewProfile")}
        </ButtonLink>
        <Button variant="ghost" onClick={onAnother} icon={<UserPlus className="size-4" aria-hidden />}>
          {t("register.another")}
        </Button>
      </div>
      <p className="mt-6 text-sm text-muted">
        <Link href="/riders" className="font-semibold text-forest underline">
          {t("register.backToRoster")}
        </Link>
      </p>
    </div>
  );
}
