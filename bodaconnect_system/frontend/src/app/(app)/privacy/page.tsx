"use client";

import { useI18n } from "@/i18n";
import { useApi, useMe } from "@/lib/hooks";
import { hasRole } from "@/lib/roles";
import { formatDate } from "@/lib/format";
import type { Disclosure, ListResponse } from "@/lib/types";
import { Card, CardBody, CardHeader, EmptyState, PageHeader, SkeletonRows, Table, TD, TH, THead, TR } from "@/components/ui";
import { ActiveNotice } from "@/components/common/PrivacyNotice";
import { ConsentsSection, DisclosuresSection } from "@/components/rider/sections";
import { Disclaimer } from "@/components/common/Disclaimer";

function AllDisclosures() {
  const { t, lang } = useI18n();
  const q = useApi<ListResponse<Disclosure>>("/privacy/disclosures", { perPage: 50 });
  if (q.isPending) return <SkeletonRows rows={3} />;
  if (!q.data?.data?.length) return <EmptyState title={t("disclosure.none")} />;
  return (
    <Table>
      <THead>
        <tr>
          <TH>{t("disclosure.subject")}</TH>
          <TH>{t("disclosure.recipient")}</TH>
          <TH>{t("disclosure.purpose")}</TH>
          <TH>{t("disclosure.date")}</TH>
        </tr>
      </THead>
      <tbody>
        {q.data.data.map((d) => (
          <TR key={d.id}>
            <TD>{d.subjectName ?? d.subjectPersonId}</TD>
            <TD>{d.recipientOrgName ?? d.recipientOrgId}</TD>
            <TD>{d.purpose}</TD>
            <TD className="whitespace-nowrap">{formatDate(d.createdAt, lang)}</TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}

export default function PrivacyPage() {
  const { t } = useI18n();
  const me = useMe();
  const personId = me.data?.person?.id;
  const isRider = hasRole(me.data, "rider", "owner");
  return (
    <div className="mx-auto grid grid-cols-1 max-w-3xl gap-4">
      <PageHeader eyebrow={t("privacy.eyebrow")} title={t("privacy.title")} description={t("privacy.subtitle")} />
      <Card>
        <CardHeader title={t("privacy.noticeTitle")} />
        <CardBody>
          <ActiveNotice compact />
        </CardBody>
      </Card>
      {isRider && personId && (
        <>
          <Card>
            <CardHeader title={t("consent.title")} description={t("consent.subtitle")} />
            <CardBody>
              <ConsentsSection riderId={personId} canWithdraw />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("disclosure.title")} description={t("disclosure.subtitle")} />
            <CardBody>
              <DisclosuresSection personId={personId} />
            </CardBody>
          </Card>
        </>
      )}
      {hasRole(me.data, "platform_admin") && (
        <Card>
          <CardHeader title={t("disclosure.allTitle")} description={t("disclosure.allSubtitle")} />
          <CardBody>
            <AllDisclosures />
          </CardBody>
        </Card>
      )}
      <Disclaimer />
    </div>
  );
}
