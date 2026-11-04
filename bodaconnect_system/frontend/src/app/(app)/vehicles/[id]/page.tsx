"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Info, Link2, Motorbike } from "lucide-react";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { useApi, useMe } from "@/lib/hooks";
import { hasRole } from "@/lib/roles";
import { formatDate, formatDateTime } from "@/lib/format";
import type { ID, ItemResponse, Vehicle, VehicleRelationship } from "@/lib/types";
import { Badge, Button, Card, CardBody, CardHeader, ConfirmModal, DefinitionList, EmptyState, ErrorState, Input, Skeleton, StatusPill, useToast } from "@/components/ui";
import { LinkPersonDrawer } from "@/components/vehicle/LinkPersonDrawer";

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, tx, lang } = useI18n();
  const me = useMe();
  const toast = useToast();
  const qc = useQueryClient();
  const q = useApi<ItemResponse<Vehicle>>(`/vehicles/${id}`);
  const [linkOpen, setLinkOpen] = useState(false);
  const [ending, setEnding] = useState<VehicleRelationship | null>(null);
  const [endAt, setEndAt] = useState("");
  const canManage = hasRole(me.data, "field_agent", "association_admin", "platform_admin");

  const end = useMutation({
    mutationFn: (relId: ID) => api(`/vehicle-relationships/${relId}/end`, { method: "POST", body: { endAt: endAt || undefined } }),
    onSuccess: () => {
      setEnding(null);
      setEndAt("");
      toast.success(t("vehicle.relationshipEnded"));
      qc.invalidateQueries({ queryKey: [`/vehicles/${id}`] });
    },
    onError: (e) => toast.error(e),
  });

  if (q.isPending) return <Skeleton className="h-96 w-full rounded-[20px]" />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const v = q.data.data;
  const rels = [...(v.relationships ?? [])].sort((a, b) => (b.startAt ?? "").localeCompare(a.startAt ?? ""));
  const active = rels.filter((r) => !r.endAt);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/vehicles" className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {t("vehicle.title")}
      </Link>
      <Card className="mb-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-mint text-forest">
            <Motorbike className="size-7" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-mono text-[26px] font-extrabold tracking-tight">{v.registrationNumber}</h1>
            <p className="text-sm text-muted">
              {tx(`vehicleType.${v.vehicleType}`, v.vehicleType)} · {[v.make, v.model, v.colour].filter(Boolean).join(" · ") || "-"}
            </p>
          </div>
          <StatusPill status={v.verificationStatus ?? v.status ?? "unverified"} />
          {canManage && (
            <Button onClick={() => setLinkOpen(true)} icon={<Link2 className="size-4" aria-hidden />}>
              {t("vehicle.linkPerson")}
            </Button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader title={t("vehicle.details")} />
          <CardBody>
            <DefinitionList
              className="sm:grid-cols-1"
              items={[
                { label: t("vehicle.plate"), value: <span className="font-mono">{v.registrationNumber}</span> },
                { label: t("vehicle.normalised"), value: <span className="font-mono">{v.registrationNumberNormalised ?? "-"}</span> },
                { label: t("vehicle.type"), value: tx(`vehicleType.${v.vehicleType}`, v.vehicleType) },
                { label: t("vehicle.currentPeople"), value: active.length ? active.map((r) => `${r.personName ?? "-"} (${tx(`relationship.${r.relationshipType}`, r.relationshipType)})`).join(", ") : "-" },
                { label: t("roster.registered"), value: formatDateTime(v.createdAt, lang) },
              ]}
            />
            <p className="mt-5 flex items-start gap-2 rounded-[12px] bg-info-50 p-3 text-sm text-info-900">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden /> {t("register.operatorNote")}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("vehicle.timeline")} description={t("vehicle.timelineDesc")} />
          <CardBody>
            {rels.length ? (
              <ol className="relative ml-2 border-l-2 border-line pl-5">
                {rels.map((r) => (
                  <li key={r.id} className="relative mb-5 last:mb-0">
                    <span className={`absolute -left-[27px] top-1.5 size-3 rounded-full ring-4 ring-white ${r.endAt ? "bg-line" : "bg-brand"}`} aria-hidden />
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">
                          {r.personId ? (
                            <Link href={`/riders/${r.personId}`} className="hover:underline">
                              {r.personName ?? r.personId}
                            </Link>
                          ) : (
                            (r.personName ?? "-")
                          )}{" "}
                          <Badge tone={r.relationshipType === "owner" ? "info" : "brand"}>{tx(`relationship.${r.relationshipType}`, r.relationshipType)}</Badge>
                        </p>
                        <p className="text-sm text-muted">
                          {formatDate(r.startAt, lang)} → {r.endAt ? formatDate(r.endAt, lang) : t("membership.present")}
                        </p>
                        {r.verificationStatus && <StatusPill status={r.verificationStatus} className="mt-1" />}
                      </div>
                      {canManage && !r.endAt && (
                        <Button size="sm" variant="ghost" onClick={() => setEnding(r)}>
                          {t("vehicle.endRelationship")}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState title={t("vehicle.noRelationships")} />
            )}
          </CardBody>
        </Card>
      </div>

      <LinkPersonDrawer open={linkOpen} onClose={() => setLinkOpen(false)} vehicleId={v.id} />
      <ConfirmModal
        open={ending !== null}
        onClose={() => setEnding(null)}
        onConfirm={() => ending && end.mutate(ending.id)}
        loading={end.isPending}
        tone="danger"
        title={t("vehicle.endRelationship")}
        description={t("vehicle.endRelationshipBody", { name: ending?.personName ?? "" })}
        confirmLabel={t("vehicle.endRelationship")}
      >
        <Input label={t("vehicle.endAt")} type="date" optionalLabel={t("common.optional")} value={endAt} onChange={(e) => setEndAt(e.target.value)} />
      </ConfirmModal>
    </div>
  );
}
