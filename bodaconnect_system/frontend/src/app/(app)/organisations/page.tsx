"use client";

import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { useI18n } from "@/i18n";
import { useOrganisations } from "@/lib/orgs";
import { Card, EmptyState, ErrorState, PageHeader, SkeletonRows } from "@/components/ui";

export default function OrganisationsPage() {
  const { t, tx } = useI18n();
  const q = useOrganisations();
  return (
    <>
      <PageHeader eyebrow={t("org.eyebrow")} title={t("org.listTitle")} description={t("org.listSubtitle")} />
      {q.isPending ? (
        <SkeletonRows rows={3} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data.data.length ? (
        <Card>
          <EmptyState title={t("org.none")} />
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {q.data.data.map((o) => (
            <li key={o.id}>
              <Link href={`/organisations/${o.id}`} className="flex items-center gap-4 rounded-[20px] border border-line bg-white p-5 shadow-soft hover:border-brand">
                <span className="flex size-12 items-center justify-center rounded-full bg-mint text-forest">
                  <Building2 className="size-6" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink">{o.name}</p>
                  <p className="text-sm text-muted">{o.type ? tx(`orgType.${o.type}`, o.type) : ""}</p>
                </div>
                <ChevronRight className="size-5 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
