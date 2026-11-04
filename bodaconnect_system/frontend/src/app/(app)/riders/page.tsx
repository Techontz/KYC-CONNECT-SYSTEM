"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { ChevronRight, CopyCheck, Filter, Search, UserPlus, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { useApi, useMe } from "@/lib/hooks";
import { useUrlState } from "@/lib/useUrlState";
import { useGroups, useOrganisations, useParkingPoints } from "@/lib/orgs";
import { completenessPercent, formatDate } from "@/lib/format";
import { hasRole, primaryOrganisation } from "@/lib/roles";
import type { ListResponse, RiderListItem } from "@/lib/types";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  Select,
  SkeletonRows,
  StatusPill,
  Table,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";

const STATUSES = ["draft", "submitted", "under_review", "verified", "correction_required", "rejected", "archived"];
const KEYS = ["q", "organisationId", "groupId", "parkingPointId", "status", "registeredFrom", "registeredTo"] as const;

function Completeness({ value }: { value: RiderListItem["completeness"] }) {
  const p = completenessPercent(value);
  if (p === null) return <span className="text-muted">-</span>;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-mint-50" aria-hidden>
        <span className="block h-full rounded-full bg-brand" style={{ width: `${p}%` }} />
      </span>
      <span className="text-xs font-semibold text-ink">{p}%</span>
    </span>
  );
}

function hasDuplicate(f: RiderListItem["duplicateFlag"]) {
  if (!f) return false;
  if (typeof f === "boolean") return f;
  return f.status ? f.status === "open" : true;
}

function Roster() {
  const { t, lang } = useI18n();
  const me = useMe();
  const { values, set, page } = useUrlState(KEYS);
  const [q, setQ] = useState(values.q);
  const [showFilters, setShowFilters] = useState(false);
  const isPlatform = hasRole(me.data, "platform_admin", "verifier");
  const orgs = useOrganisations();
  const orgId = values.organisationId || (primaryOrganisation(me.data)?.id ? String(primaryOrganisation(me.data)!.id) : "");
  const groups = useGroups(orgId || null);
  const points = useParkingPoints(orgId || null);
  const list = useApi<ListResponse<RiderListItem>>("/riders", { ...values, page, perPage: 25 }, { placeholderData: (prev) => prev });

  const activeFilters = KEYS.filter((k) => k !== "q" && values[k]).length;
  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    set({ q: q.trim() });
  };

  return (
    <>
      <PageHeader
        eyebrow={t("roster.eyebrow")}
        title={t("roster.title")}
        description={t("roster.subtitle")}
        actions={
          hasRole(me.data, "field_agent", "association_admin", "platform_admin") ? (
            <ButtonLink href="/riders/new" icon={<UserPlus className="size-4" aria-hidden />}>
              {t("nav.register")}
            </ButtonLink>
          ) : undefined
        }
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap gap-2">
          <form onSubmit={onSearch} role="search" className="flex min-w-0 flex-1 gap-2">
            <label htmlFor="roster-q" className="sr-only">
              {t("search.label")}
            </label>
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="roster-q"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("search.placeholder")}
                className="min-h-11 w-full rounded-[12px] border border-line pl-10 pr-3 text-[15px] focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"
              />
            </div>
            <Button type="submit" variant="dark" className="shrink-0">
              {t("common.search")}
            </Button>
          </form>
          <Button variant="secondary" onClick={() => setShowFilters((s) => !s)} aria-expanded={showFilters} aria-controls="roster-filters" icon={<Filter className="size-4" aria-hidden />}>
            {t("common.filters")}
            {activeFilters > 0 && <Badge tone="brand">{activeFilters}</Badge>}
          </Button>
        </div>
        {showFilters && (
          <div id="roster-filters" className="mt-4 grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-3">
            {isPlatform && (
              <Select
                label={t("rider.organisation")}
                placeholder={t("common.all")}
                options={(orgs.data?.data ?? []).map((o) => ({ value: String(o.id), label: o.name }))}
                value={values.organisationId}
                onChange={(e) => set({ organisationId: e.target.value, groupId: null, parkingPointId: null })}
              />
            )}
            <Select
              label={t("rider.group")}
              placeholder={t("common.all")}
              options={(groups.data?.data ?? []).map((g) => ({ value: String(g.id), label: g.name }))}
              value={values.groupId}
              onChange={(e) => set({ groupId: e.target.value })}
            />
            <Select
              label={t("rider.parkingPoint")}
              placeholder={t("common.all")}
              options={(points.data?.data ?? []).map((p) => ({ value: String(p.id), label: p.name }))}
              value={values.parkingPointId}
              onChange={(e) => set({ parkingPointId: e.target.value })}
            />
            <Select
              label={t("common.status")}
              placeholder={t("common.all")}
              options={STATUSES.map((s) => ({ value: s, label: t(`status.${s}` as "status.draft") }))}
              value={values.status}
              onChange={(e) => set({ status: e.target.value })}
            />
            <Input label={t("roster.registeredFrom")} type="date" value={values.registeredFrom} onChange={(e) => set({ registeredFrom: e.target.value })} />
            <Input label={t("roster.registeredTo")} type="date" value={values.registeredTo} onChange={(e) => set({ registeredTo: e.target.value })} />
            {activeFilters > 0 && (
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  icon={<X className="size-4" aria-hidden />}
                  onClick={() => set({ organisationId: null, groupId: null, parkingPointId: null, status: null, registeredFrom: null, registeredTo: null })}
                >
                  {t("common.clearFilters")}
                </Button>
              </div>
            )}
          </div>
        )}
      </Card>

      {list.isPending ? (
        <SkeletonRows rows={8} />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.data.data.length ? (
        <Card>
          <EmptyState
            kind={values.q || activeFilters ? "search" : "empty"}
            title={values.q || activeFilters ? t("roster.noMatches") : t("roster.empty")}
            description={values.q || activeFilters ? t("roster.noMatchesHint") : t("roster.emptyHint")}
          />
        </Card>
      ) : (
        <>
          {/* Desktop table */}
          <Card className="hidden overflow-hidden md:block">
            <Table aria-busy={list.isFetching}>
              <caption className="sr-only">{t("roster.title")}</caption>
              <THead>
                <tr>
                  <TH>{t("rider.name")}</TH>
                  <TH>{t("rider.systemId")}</TH>
                  <TH>{t("rider.phone")}</TH>
                  <TH>{t("rider.group")}</TH>
                  <TH>{t("common.status")}</TH>
                  <TH>{t("rider.completeness")}</TH>
                  <TH>{t("roster.registered")}</TH>
                  <TH>
                    <span className="sr-only">{t("common.open")}</span>
                  </TH>
                </tr>
              </THead>
              <tbody>
                {list.data.data.map((r) => (
                  <TR key={r.id}>
                    <TD>
                      <Link href={`/riders/${r.id}`} className="font-semibold text-ink hover:text-forest hover:underline">
                        {r.legalName}
                      </Link>
                      {r.preferredName && r.preferredName !== r.legalName && <span className="block text-xs text-muted">“{r.preferredName}”</span>}
                    </TD>
                    <TD className="font-mono text-xs">{r.systemId}</TD>
                    <TD className="whitespace-nowrap">{r.phoneMasked ?? "-"}</TD>
                    <TD>
                      {r.groupName ?? "-"}
                      {r.parkingPointName && <span className="block text-xs text-muted">{r.parkingPointName}</span>}
                    </TD>
                    <TD>
                      <div className="flex flex-col items-start gap-1">
                        <StatusPill status={r.profileStatus} />
                        {hasDuplicate(r.duplicateFlag) && (
                          <Badge tone="warning" icon={<CopyCheck className="size-3.5" aria-hidden />}>
                            {t("roster.possibleDuplicate")}
                          </Badge>
                        )}
                      </div>
                    </TD>
                    <TD>
                      <Completeness value={r.completeness} />
                    </TD>
                    <TD className="whitespace-nowrap text-muted">{formatDate(r.createdAt, lang)}</TD>
                    <TD>
                      <Link href={`/riders/${r.id}`} aria-label={`${t("common.open")} ${r.legalName}`} className="inline-flex size-9 items-center justify-center rounded-full hover:bg-mint">
                        <ChevronRight className="size-4" aria-hidden />
                      </Link>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-2 md:hidden">
            {list.data.data.map((r) => (
              <li key={r.id}>
                <Link href={`/riders/${r.id}`} className="block rounded-[20px] border border-line bg-white p-4 shadow-soft active:bg-mint-50">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-ink">{r.legalName}</p>
                      <p className="font-mono text-xs text-muted">{r.systemId}</p>
                    </div>
                    <StatusPill status={r.profileStatus} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                    <span>{r.phoneMasked ?? "-"}</span>
                    <span>{r.groupName ?? t("riderHome.noGroup")}</span>
                    <Completeness value={r.completeness} />
                  </div>
                  {hasDuplicate(r.duplicateFlag) && (
                    <Badge tone="warning" className="mt-2" icon={<CopyCheck className="size-3.5" aria-hidden />}>
                      {t("roster.possibleDuplicate")}
                    </Badge>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          <Pagination meta={list.data.meta} onPage={(p) => set({ page: p })} />
        </>
      )}
    </>
  );
}

export default function RidersPage() {
  return (
    <Suspense fallback={<SkeletonRows rows={8} />}>
      <Roster />
    </Suspense>
  );
}
