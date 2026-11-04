"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Link2, Motorbike, Plus, Search } from "lucide-react";
import { useI18n } from "@/i18n";
import { useApi, useMe } from "@/lib/hooks";
import { useUrlState } from "@/lib/useUrlState";
import { hasRole } from "@/lib/roles";
import type { ID, ItemResponse, ListResponse, RiderDetail, Vehicle } from "@/lib/types";
import { Button, ButtonLink, Card, EmptyState, ErrorState, PageHeader, Pagination, Select, SkeletonRows, StatusPill, Table, TD, TH, THead, TR } from "@/components/ui";
import { LinkPersonDrawer } from "@/components/vehicle/LinkPersonDrawer";

function VehiclesList() {
  const { t, tx } = useI18n();
  const me = useMe();
  const params = useSearchParams();
  const linkPerson = params.get("linkPerson");
  const { values, set, page } = useUrlState(["q", "vehicleType", "status"] as const);
  const [q, setQ] = useState(values.q);
  const [linkVehicle, setLinkVehicle] = useState<ID | null>(null);
  const list = useApi<ListResponse<Vehicle>>("/vehicles", { ...values, page, perPage: 25 }, { placeholderData: (p) => p });
  const person = useApi<ItemResponse<RiderDetail>>(linkPerson ? `/riders/${linkPerson}` : null);
  const canCreate = hasRole(me.data, "field_agent", "association_admin", "platform_admin");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    set({ q: q.trim() });
  };

  return (
    <>
      <PageHeader
        eyebrow={t("vehicle.eyebrow")}
        title={t("vehicle.title")}
        description={t("vehicle.subtitle")}
        actions={
          canCreate ? (
            <ButtonLink href={linkPerson ? `/vehicles/new?personId=${linkPerson}` : "/vehicles/new"} icon={<Plus className="size-4" aria-hidden />}>
              {t("vehicle.new")}
            </ButtonLink>
          ) : undefined
        }
      />
      {linkPerson && (
        <p role="status" className="mb-4 flex items-center gap-2 rounded-[16px] bg-info-50 p-4 text-sm text-info-900">
          <Link2 className="size-4 shrink-0" aria-hidden />
          {t("vehicle.pickToLink", { name: person.data?.data.legalName ?? "…" })}
        </p>
      )}
      <Card className="mb-4 flex flex-wrap gap-2 p-4">
        <form onSubmit={onSearch} role="search" className="flex min-w-0 flex-[2] basis-64 gap-2">
          <label htmlFor="veh-q" className="sr-only">
            {t("vehicle.search")}
          </label>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="veh-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("vehicle.search")}
              className="min-h-11 w-full rounded-[12px] border border-line pl-10 pr-3 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"
            />
          </div>
          <Button type="submit" variant="dark">
            {t("common.search")}
          </Button>
        </form>
        <Select
          aria-label={t("vehicle.type")}
          wrapperClassName="flex-1 basis-40"
          placeholder={t("vehicle.allTypes")}
          options={["motorcycle", "bajaji"].map((v) => ({ value: v, label: tx(`vehicleType.${v}`, v) }))}
          value={values.vehicleType}
          onChange={(e) => set({ vehicleType: e.target.value })}
        />
      </Card>

      {list.isPending ? (
        <SkeletonRows />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.data.data.length ? (
        <Card>
          <EmptyState kind={values.q ? "search" : "empty"} title={t("vehicle.none")} description={t("vehicle.noneHint")} />
        </Card>
      ) : (
        <>
          <Card className="hidden overflow-hidden md:block">
            <Table>
              <caption className="sr-only">{t("vehicle.title")}</caption>
              <THead>
                <tr>
                  <TH>{t("vehicle.plate")}</TH>
                  <TH>{t("vehicle.type")}</TH>
                  <TH>{t("vehicle.makeModel")}</TH>
                  <TH>{t("vehicle.people")}</TH>
                  <TH>{t("common.status")}</TH>
                  <TH>
                    <span className="sr-only">{t("common.actions")}</span>
                  </TH>
                </tr>
              </THead>
              <tbody>
                {list.data.data.map((v) => {
                  const active = (v.relationships ?? []).filter((r) => !r.endAt);
                  return (
                    <TR key={v.id}>
                      <TD>
                        <Link href={`/vehicles/${v.id}`} className="font-mono font-bold hover:underline">
                          {v.registrationNumber}
                        </Link>
                      </TD>
                      <TD>{tx(`vehicleType.${v.vehicleType}`, v.vehicleType)}</TD>
                      <TD>{[v.make, v.model].filter(Boolean).join(" ") || "-"}</TD>
                      <TD className="text-sm">
                        {active.length
                          ? active.map((r) => (
                              <span key={r.id} className="block">
                                {r.personName ?? "-"} <span className="text-muted">({tx(`relationship.${r.relationshipType}`, r.relationshipType)})</span>
                              </span>
                            ))
                          : "-"}
                      </TD>
                      <TD>
                        <StatusPill status={v.verificationStatus ?? v.status ?? "unverified"} />
                      </TD>
                      <TD>
                        {linkPerson ? (
                          <Button size="sm" onClick={() => setLinkVehicle(v.id)}>
                            {t("vehicle.link")}
                          </Button>
                        ) : (
                          <Link href={`/vehicles/${v.id}`} className="text-sm font-semibold text-forest hover:underline">
                            {t("common.open")}
                          </Link>
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          </Card>
          <ul className="grid grid-cols-1 gap-2 md:hidden">
            {list.data.data.map((v) => (
              <li key={v.id} className="rounded-[20px] border border-line bg-white p-4 shadow-soft">
                <Link href={`/vehicles/${v.id}`} className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint-50 text-forest">
                    <Motorbike className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono font-bold">{v.registrationNumber}</p>
                    <p className="text-sm text-muted">
                      {tx(`vehicleType.${v.vehicleType}`, v.vehicleType)} {v.make ? `· ${v.make}` : ""}
                    </p>
                  </div>
                  <StatusPill status={v.verificationStatus ?? v.status ?? "unverified"} />
                </Link>
                {linkPerson && (
                  <Button size="sm" className="mt-3" block onClick={() => setLinkVehicle(v.id)}>
                    {t("vehicle.link")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <Pagination meta={list.data.meta} onPage={(p) => set({ page: p })} />
        </>
      )}
      {linkPerson && (
        <LinkPersonDrawer
          open={linkVehicle !== null}
          onClose={() => setLinkVehicle(null)}
          vehicleId={linkVehicle}
          personId={linkPerson}
          personLabel={person.data?.data.legalName}
        />
      )}
    </>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={<SkeletonRows />}>
      <VehiclesList />
    </Suspense>
  );
}
