"use client";

import Link from "next/link";
import { ArrowRight, Bell, Building2, CircleCheck, CircleDashed, IdCard, LifeBuoy, Lock, Motorbike } from "lucide-react";
import { useI18n } from "@/i18n";
import { useApi } from "@/lib/hooks";
import { formatDate, formatDateTime, humanize } from "@/lib/format";
import type { ItemResponse, ListResponse, Me, Notification, RiderDetail } from "@/lib/types";
import { Card, CardBody, CardHeader, EmptyState, ErrorState, Eyebrow, Skeleton, StatusPill } from "@/components/ui";
import { CompletenessRing } from "@/components/common/CompletenessRing";
import { Disclaimer } from "@/components/common/Disclaimer";

export function RiderHome({ me }: { me: Me }) {
  const { t, tx, lang } = useI18n();
  const personId = me.person?.id;
  const rider = useApi<ItemResponse<RiderDetail>>(personId ? `/riders/${personId}` : null);
  const notices = useApi<ListResponse<Notification>>("/notifications", { perPage: 3 });

  if (!personId)
    return (
      <EmptyState
        title={t("riderHome.noProfileTitle")}
        description={t("riderHome.noProfileBody")}
        action={
          <Link href="/support" className="font-semibold text-forest underline">
            {t("nav.support")}
          </Link>
        }
      />
    );

  if (rider.isPending)
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-44 w-full rounded-[20px]" />
        <Skeleton className="h-40 w-full rounded-[20px]" />
      </div>
    );
  if (rider.isError) return <ErrorState error={rider.error} onRetry={() => rider.refetch()} />;

  const r = rider.data.data;
  const pct = r.completeness?.percent ?? 0;
  const missing = r.completeness?.missing ?? [];
  const membership = r.memberships?.find((m) => !m.endAt) ?? r.memberships?.[0];
  const group = r.groupMemberships?.find((g) => !g.endAt) ?? r.groupMemberships?.[0];
  const vehicle = r.vehicles?.[0];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <section className="overflow-hidden rounded-[20px] bg-forest text-white shadow-soft">
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <Eyebrow className="self-start">{t("riderHome.eyebrow")}</Eyebrow>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[26px] font-extrabold tracking-[-0.02em]">{r.preferredName || r.legalName}</h1>
              <p className="mt-1 text-sm text-mint/90">
                {t("rider.systemId")}: <span className="font-mono font-semibold text-white">{r.systemId}</span>
              </p>
            </div>
            <StatusPill status={r.profileStatus} className="bg-white" />
          </div>
          <p className="text-[15px] text-white/85">{tx(`statusExplain.${r.profileStatus}`, "")}</p>
        </div>
      </section>

      <Card>
        <CardHeader title={t("riderHome.completeness")} description={t("riderHome.completenessDesc")} />
        <CardBody className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
          <CompletenessRing percent={pct} label={t("riderHome.completeness")} />
          <div className="w-full min-w-0 flex-1">
            {missing.length ? (
              <>
                <p className="mb-2 text-sm font-semibold text-ink">{t("riderHome.missingTitle")}</p>
                <ul className="flex flex-col gap-2">
                  {missing.map((m) => (
                    <li key={m} className="flex items-start gap-2 rounded-[12px] bg-amber-50 px-3 py-2.5 text-sm text-ink">
                      <CircleDashed className="mt-0.5 size-4 shrink-0 text-amber-900" aria-hidden />
                      <span>{tx(`missing.${m}`, m.includes(" ") ? m : humanize(m))}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/me#correction" className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-forest hover:underline">
                  {t("riderHome.fixMissing")} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </>
            ) : (
              <p className="flex items-center gap-2 text-sm font-semibold text-success-900">
                <CircleCheck className="size-5 text-brand" aria-hidden /> {t("riderHome.complete")}
              </p>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Building2 className="size-4" aria-hidden /> {t("riderHome.membership")}
          </div>
          {membership || group ? (
            <div className="mt-2">
              <p className="text-base font-bold text-ink">{membership?.organisationName ?? r.organisationName ?? "-"}</p>
              <p className="text-sm text-muted">
                {group?.groupName ?? r.groupName ?? t("riderHome.noGroup")}
                {group?.parkingPointName || r.parkingPointName ? ` · ${group?.parkingPointName ?? r.parkingPointName}` : ""}
              </p>
              {membership?.startAt && <p className="mt-1 text-xs text-muted">{t("riderHome.memberSince", { date: formatDate(membership.startAt, lang) })}</p>}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">{t("riderHome.noMembership")}</p>
          )}
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted">
            <Motorbike className="size-4" aria-hidden /> {t("riderHome.vehicle")}
          </div>
          {vehicle ? (
            <Link href={`/vehicles/${vehicle.id}`} className="mt-2 block">
              <p className="font-mono text-base font-bold text-ink">{vehicle.registrationNumber}</p>
              <p className="text-sm text-muted">
                {tx(`vehicleType.${vehicle.vehicleType}`, humanize(vehicle.vehicleType))}
                {vehicle.make ? ` · ${vehicle.make}` : ""}
                {(vehicle.relationship?.relationshipType ?? vehicle.relationshipType)
                  ? ` · ${tx(`relationship.${vehicle.relationship?.relationshipType ?? vehicle.relationshipType}`, "")}`
                  : ""}
              </p>
            </Link>
          ) : (
            <p className="mt-2 text-sm text-muted">{t("riderHome.noVehicle")}</p>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t("nav.notices")}
          action={
            <Link href="/notices" className="inline-flex min-h-11 items-center text-sm font-semibold text-forest hover:underline">
              {t("common.viewAll")}
            </Link>
          }
        />
        <CardBody>
          {notices.isPending ? (
            <Skeleton className="h-16 w-full" />
          ) : notices.data?.data?.length ? (
            <ul className="flex flex-col divide-y divide-line">
              {notices.data.data.map((n) => (
                <li key={n.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <Bell className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">{n.title}</p>
                    {n.body && <p className="line-clamp-2 text-sm text-muted">{n.body}</p>}
                    <p className="mt-0.5 text-xs text-muted">{formatDateTime(n.createdAt, lang)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t("notices.empty")}</p>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { href: "/me", label: t("nav.me"), icon: <IdCard className="size-5" aria-hidden /> },
          { href: "/support", label: t("support.newCorrection"), icon: <LifeBuoy className="size-5" aria-hidden /> },
          { href: "/privacy", label: t("nav.privacy"), icon: <Lock className="size-5" aria-hidden /> },
        ].map((x) => (
          <Link key={x.href} href={x.href} className="flex min-h-14 items-center gap-3 rounded-[20px] border border-line bg-white px-4 font-semibold text-ink shadow-soft hover:border-brand">
            <span className="text-brand">{x.icon}</span>
            {x.label}
          </Link>
        ))}
      </div>

      <Disclaimer />
    </div>
  );
}
