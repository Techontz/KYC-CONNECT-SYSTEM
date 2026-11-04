"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bike, Info, Motorbike } from "lucide-react";
import { useI18n } from "@/i18n";
import { ApiError, api, applyFieldErrors } from "@/lib/api";
import { useApi, useIdempotencyKey, useLookups } from "@/lib/hooks";
import { normalisePlate, toOptions } from "@/lib/format";
import type { ItemResponse, RiderDetail, Vehicle } from "@/lib/types";
import { Button, ButtonLink, Card, Input, PageHeader, RadioCard, Select, SkeletonRows, useToast } from "@/components/ui";

function NewVehicleForm() {
  const { t, tx, lang } = useI18n();
  const router = useRouter();
  const toast = useToast();
  const qc = useQueryClient();
  const lookups = useLookups();
  const params = useSearchParams();
  const personId = params.get("personId");
  const person = useApi<ItemResponse<RiderDetail>>(personId ? `/riders/${personId}` : null);
  const idem = useIdempotencyKey();
  const relIdem = useIdempotencyKey();
  const [conflict, setConflict] = useState<{ id?: string | number; registrationNumber?: string } | null>(null);

  const schema = z.object({
    vehicleType: z.enum(["motorcycle", "bajaji"]),
    registrationNumber: z
      .string()
      .trim()
      .refine((v) => normalisePlate(v).length >= 4, t("validation.plate")),
    make: z.string().optional(),
    model: z.string().trim().max(60).optional(),
    colour: z.string().trim().max(30).optional(),
    relationshipType: z.string().optional(),
  });
  type V = z.infer<typeof schema>;
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { vehicleType: "motorcycle", registrationNumber: "", make: "", model: "", colour: "", relationshipType: "operator" } });
  const vt = useWatch({ control: form.control, name: "vehicleType" });
  const rt = useWatch({ control: form.control, name: "relationshipType" });
  const er = form.formState.errors;

  const m = useMutation({
    mutationFn: async (v: V) => {
      const res = await api<ItemResponse<Vehicle>>("/vehicles", {
        method: "POST",
        idempotencyKey: idem.get(),
        body: { vehicleType: v.vehicleType, registrationNumber: v.registrationNumber.trim(), make: v.make || undefined, model: v.model || undefined, colour: v.colour || undefined },
      });
      if (personId && v.relationshipType) {
        await api(`/vehicles/${res.data.id}/relationships`, {
          method: "POST",
          idempotencyKey: relIdem.get(),
          body: { personId, relationshipType: v.relationshipType },
        });
      }
      return res.data;
    },
    onSuccess: (v) => {
      idem.reset();
      relIdem.reset();
      qc.invalidateQueries({ queryKey: ["/vehicles"] });
      if (personId) qc.invalidateQueries({ queryKey: [`/riders/${personId}`] });
      toast.success(t("vehicle.created"), v.registrationNumber);
      router.push(`/vehicles/${v.id}`);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.isDefinitive) idem.reset();
      if (e instanceof ApiError && e.status === 409) {
        const match = (e.details?.match ?? (e.details?.matches as unknown[] | undefined)?.[0]) as { id?: string | number; registrationNumber?: string } | undefined;
        setConflict(match ?? {});
        return;
      }
      applyFieldErrors(e, form.setError);
      toast.error(e);
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader eyebrow={t("vehicle.eyebrow")} title={t("vehicle.new")} description={t("vehicle.newSubtitle")} />
      <Card className="p-5 sm:p-8">
        {conflict && (
          <div role="alert" className="mb-5 rounded-[16px] border border-danger/40 bg-danger-50 p-4 text-sm text-danger-900">
            <p className="font-bold">{t("vehicle.duplicatePlate")}</p>
            <p className="mt-1 text-ink">{t("vehicle.duplicatePlateBody")}</p>
            {conflict.id && (
              <Link href={`/vehicles/${conflict.id}`} className="mt-2 inline-flex min-h-11 items-center font-semibold text-forest underline">
                {t("vehicle.openExisting")} {conflict.registrationNumber ?? ""}
              </Link>
            )}
          </div>
        )}
        <form className="grid grid-cols-1 gap-5" onSubmit={form.handleSubmit((v) => m.mutate(v))} noValidate>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("vehicle.type")}>
            {(["motorcycle", "bajaji"] as const).map((x) => (
              <RadioCard
                key={x}
                value={x}
                checked={vt === x}
                title={tx(`vehicleType.${x}`, x)}
                icon={x === "motorcycle" ? <Motorbike className="size-5" aria-hidden /> : <Bike className="size-5" aria-hidden />}
                {...form.register("vehicleType")}
              />
            ))}
          </div>
          <Input label={t("vehicle.plate")} required placeholder="MC 123 ABC" autoCapitalize="characters" hint={t("vehicle.plateHint")} error={er.registrationNumber?.message} {...form.register("registrationNumber")} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Select label={t("vehicle.make")} optionalLabel={t("common.optional")} placeholder={t("common.select")} options={toOptions(lookups.data?.vehicleMakes, lang)} {...form.register("make")} />
            <Input label={t("vehicle.model")} optionalLabel={t("common.optional")} {...form.register("model")} />
            <Input label={t("vehicle.colour")} optionalLabel={t("common.optional")} {...form.register("colour")} />
          </div>
          {personId && (
            <div className="grid grid-cols-1 gap-2">
              <p className="text-sm font-semibold">
                {t("vehicle.relationshipFor", { name: person.data?.data.legalName ?? "…" })}
              </p>
              {(["owner", "operator", "keeper"] as const).map((x) => (
                <RadioCard key={x} value={x} checked={rt === x} title={tx(`relationship.${x}`, x)} description={tx(`relationshipDesc.${x}`, "")} {...form.register("relationshipType")} />
              ))}
              <p className="flex items-start gap-2 rounded-[12px] bg-info-50 p-3 text-sm text-info-900">
                <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("register.operatorNote")}
              </p>
            </div>
          )}
          <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-5">
            <ButtonLink href={personId ? `/riders/${personId}` : "/vehicles"} variant="ghost">
              {t("common.cancel")}
            </ButtonLink>
            <Button type="submit" loading={m.isPending}>
              {t("vehicle.save")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function NewVehiclePage() {
  return (
    <Suspense fallback={<SkeletonRows />}>
      <NewVehicleForm />
    </Suspense>
  );
}
