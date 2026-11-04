"use client";

import { useI18n } from "@/i18n";
import { useApi, useMe } from "@/lib/hooks";
import type { ItemResponse, RiderDetail } from "@/lib/types";
import { Card, CardBody, CardHeader, EmptyState, ErrorState, PageHeader, Skeleton, StatusPill } from "@/components/ui";
import { CompletenessRing } from "@/components/common/CompletenessRing";
import { Disclaimer } from "@/components/common/Disclaimer";
import { CorrectionRequestForm, MembershipsSection, OverviewSection, VehiclesSection } from "@/components/rider/sections";

export default function MyProfilePage() {
  const { t, tx } = useI18n();
  const me = useMe();
  const personId = me.data?.person?.id;
  const q = useApi<ItemResponse<RiderDetail>>(personId ? `/riders/${personId}` : null);

  if (!personId) return <EmptyState title={t("riderHome.noProfileTitle")} description={t("riderHome.noProfileBody")} />;
  if (q.isPending) return <Skeleton className="h-96 w-full rounded-[20px]" />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const r = q.data.data;

  return (
    <div className="mx-auto grid grid-cols-1 max-w-3xl gap-4">
      <PageHeader eyebrow={t("me.eyebrow")} title={t("me.title")} description={t("me.subtitle")} />

      <Card>
        <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <CompletenessRing percent={r.completeness?.percent ?? 0} label={t("rider.completeness")} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{r.legalName}</h2>
              <StatusPill status={r.profileStatus} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {t("rider.systemId")}: <span className="font-mono font-semibold text-ink">{r.systemId}</span>
            </p>
            <div className="mt-3 rounded-[12px] bg-mint-50 p-3 text-sm text-ink">
              <p className="font-semibold">{t("me.statusMeaning")}</p>
              <p className="mt-0.5 text-muted">{tx(`statusExplain.${r.profileStatus}`, "")}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("me.details")} />
        <CardBody>
          <OverviewSection rider={r} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("me.vehicles")} description={t("me.vehiclesDesc")} />
        <CardBody>
          <VehiclesSection rider={r} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("riderHome.membership")} />
        <CardBody>
          <MembershipsSection rider={r} />
        </CardBody>
      </Card>

      <Card id="correction">
        <CardHeader eyebrow={t("correction.eyebrow")} title={t("support.newCorrection")} description={t("correction.intro")} />
        <CardBody>
          <CorrectionRequestForm riderId={r.id} />
        </CardBody>
      </Card>

      <Disclaimer />
    </div>
  );
}
