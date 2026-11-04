"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Pencil, Plus, Users } from "lucide-react";
import { useI18n } from "@/i18n";
import { ApiError, api, applyFieldErrors } from "@/lib/api";
import { useApi, useIdempotencyKey, useLookups, useMe } from "@/lib/hooks";
import { useGroups, useParkingPoints } from "@/lib/orgs";
import { hasRole } from "@/lib/roles";
import { formatNumber, toOptions } from "@/lib/format";
import type { Group, GroupMember, ID, ItemResponse, ListResponse, Organisation } from "@/lib/types";
import {
  Button,
  Card,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  SkeletonRows,
  StatusPill,
  TabPanel,
  Tabs,
  useToast,
} from "@/components/ui";

export default function OrganisationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t, tx, lang } = useI18n();
  const me = useMe();
  const org = useApi<ItemResponse<Organisation>>(`/organisations/${id}`);
  const groups = useGroups(id);
  const points = useParkingPoints(id);
  const [tab, setTab] = useState("groups");
  const [groupDrawer, setGroupDrawer] = useState<{ open: boolean; group?: Group }>({ open: false });
  const [pointDrawer, setPointDrawer] = useState(false);
  const [roster, setRoster] = useState<Group | null>(null);
  const canManage = hasRole(me.data, "association_admin", "platform_admin");

  if (org.isPending) return <Skeleton className="h-64 w-full rounded-[20px]" />;
  if (org.isError) return <ErrorState error={org.error} onRetry={() => org.refetch()} />;
  const o = org.data.data;
  const counts = {
    groups: o.counts?.groups ?? o.groupsCount ?? groups.data?.meta.total,
    points: o.counts?.parkingPoints ?? o.parkingPointsCount ?? points.data?.meta.total,
    riders: o.counts?.riders ?? o.counts?.members ?? o.ridersCount,
  };

  return (
    <>
      <PageHeader eyebrow={o.type ? tx(`orgType.${o.type}`, o.type) : t("org.eyebrow")} title={o.name} description={t("org.subtitle")} />
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          [t("org.groups"), counts.groups],
          [t("org.parkingPoints"), counts.points],
          [t("dashboard.riders"), counts.riders],
        ].map(([label, n]) => (
          <Card key={String(label)} className="p-4">
            <p className="text-2xl font-extrabold tracking-tight">{formatNumber(n as number | undefined, lang)}</p>
            <p className="text-sm font-semibold text-muted">{label}</p>
          </Card>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <Tabs
            idBase="org"
            className="flex-1"
            value={tab}
            onChange={setTab}
            items={[
              { key: "groups", label: t("org.groups"), count: groups.data?.meta.total },
              { key: "points", label: t("org.parkingPoints"), count: points.data?.meta.total },
            ]}
          />
          {canManage && (
            <Button size="sm" icon={<Plus className="size-4" aria-hidden />} onClick={() => (tab === "groups" ? setGroupDrawer({ open: true }) : setPointDrawer(true))}>
              {tab === "groups" ? t("org.newGroup") : t("org.newPoint")}
            </Button>
          )}
        </div>
        <TabPanel idBase="org" tabKey={tab}>
          {tab === "groups" &&
            (groups.isPending ? (
              <SkeletonRows rows={4} />
            ) : groups.isError ? (
              <ErrorState error={groups.error} onRetry={() => groups.refetch()} />
            ) : !groups.data?.data.length ? (
              <EmptyState title={t("org.noGroups")} />
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {groups.data.data.map((g) => (
                  <li key={g.id} className="flex items-start justify-between gap-2 rounded-[16px] border border-line p-4">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{g.name}</p>
                      <p className="text-sm text-muted">
                        {g.code ? <span className="font-mono">{g.code}</span> : null}
                        {g.leaderName ? ` · ${t("org.leader")}: ${g.leaderName}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-muted">{t("org.membersCount", { n: formatNumber(g.membersCount ?? g.memberCount ?? 0, lang) })}</p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setRoster(g)} icon={<Users className="size-4" aria-hidden />}>
                        {t("org.roster")}
                      </Button>
                      {canManage && (
                        <Button size="sm" variant="ghost" aria-label={`${t("common.edit")} ${g.name}`} onClick={() => setGroupDrawer({ open: true, group: g })}>
                          <Pencil className="size-4" aria-hidden />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          {tab === "points" &&
            (points.isPending ? (
              <SkeletonRows rows={4} />
            ) : points.isError ? (
              <ErrorState error={points.error} onRetry={() => points.refetch()} />
            ) : !points.data?.data.length ? (
              <EmptyState title={t("org.noPoints")} />
            ) : (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {points.data.data.map((p) => (
                  <li key={p.id} className="flex items-start gap-3 rounded-[16px] border border-line p-4">
                    <MapPin className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                    <div>
                      <p className="font-bold text-ink">{p.name}</p>
                      <p className="text-sm text-muted">
                        {[p.ward, p.area].filter(Boolean).join(" · ") || "-"}
                        {p.latitude && p.longitude ? ` · ${Number(p.latitude).toFixed(4)}, ${Number(p.longitude).toFixed(4)}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ))}
        </TabPanel>
      </Card>

      {groupDrawer.open && <GroupDrawer orgId={id} group={groupDrawer.group} onClose={() => setGroupDrawer({ open: false })} />}
      {pointDrawer && <PointDrawer orgId={id} onClose={() => setPointDrawer(false)} />}
      <RosterDrawer group={roster} onClose={() => setRoster(null)} />
    </>
  );
}

function GroupDrawer({ orgId, group, onClose }: { orgId: ID; group?: Group; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const idem = useIdempotencyKey();
  const schema = z.object({
    name: z.string().trim().min(2, t("validation.required")).max(120),
    code: z.string().trim().min(2, t("validation.required")).max(20),
    leaderPersonId: z.string().optional(),
  });
  type V = z.infer<typeof schema>;
  const form = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: { name: group?.name ?? "", code: group?.code ?? "", leaderPersonId: group?.leaderPersonId ? String(group.leaderPersonId) : "" },
  });
  const m = useMutation({
    mutationFn: (v: V) => {
      const body = { name: v.name, code: v.code, leaderPersonId: v.leaderPersonId || undefined };
      return group
        ? api(`/groups/${group.id}`, { method: "PATCH", body })
        : api(`/organisations/${orgId}/groups`, { method: "POST", body, idempotencyKey: idem.get() });
    },
    onSuccess: () => {
      idem.reset();
      toast.success(t("common.saved"));
      qc.invalidateQueries({ queryKey: [`/organisations/${orgId}/groups`] });
      qc.invalidateQueries({ queryKey: [`/organisations/${orgId}`] });
      onClose();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.isDefinitive) idem.reset();
      applyFieldErrors(e, form.setError);
      toast.error(e);
    },
  });
  const er = form.formState.errors;
  const submit = form.handleSubmit((v) => m.mutate(v));
  return (
    <Drawer
      open
      onClose={onClose}
      title={group ? t("org.editGroup") : t("org.newGroup")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} loading={m.isPending}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4" onSubmit={submit} noValidate>
        <Input label={t("org.groupName")} required error={er.name?.message} {...form.register("name")} />
        <Input label={t("org.groupCode")} required hint={t("org.groupCodeHint")} error={er.code?.message} {...form.register("code")} />
        <Input label={t("org.leaderId")} optionalLabel={t("common.optional")} hint={t("org.leaderIdHint")} error={er.leaderPersonId?.message} {...form.register("leaderPersonId")} />
      </form>
    </Drawer>
  );
}

function PointDrawer({ orgId, onClose }: { orgId: ID; onClose: () => void }) {
  const { t, lang } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const lookups = useLookups();
  const idem = useIdempotencyKey();
  const coord = (min: number, max: number) =>
    z
      .string()
      .optional()
      .refine((v) => !v || (Number(v) >= min && Number(v) <= max), t("validation.coordinate"));
  const schema = z.object({
    name: z.string().trim().min(2, t("validation.required")).max(120),
    ward: z.string().trim().min(1, t("validation.required")),
    area: z.string().trim().max(120).optional(),
    latitude: coord(-90, 90),
    longitude: coord(-180, 180),
  });
  type V = z.infer<typeof schema>;
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { name: "", ward: "", area: "", latitude: "", longitude: "" } });
  const wards = toOptions(lookups.data?.wards, lang);
  const m = useMutation({
    mutationFn: (v: V) =>
      api(`/organisations/${orgId}/parking-points`, {
        method: "POST",
        idempotencyKey: idem.get(),
        body: { name: v.name, ward: v.ward, area: v.area || undefined, latitude: v.latitude ? Number(v.latitude) : undefined, longitude: v.longitude ? Number(v.longitude) : undefined },
      }),
    onSuccess: () => {
      idem.reset();
      toast.success(t("common.saved"));
      qc.invalidateQueries({ queryKey: [`/organisations/${orgId}/parking-points`] });
      onClose();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.isDefinitive) idem.reset();
      applyFieldErrors(e, form.setError);
      toast.error(e);
    },
  });
  const er = form.formState.errors;
  const submit = form.handleSubmit((v) => m.mutate(v));
  return (
    <Drawer
      open
      onClose={onClose}
      title={t("org.newPoint")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} loading={m.isPending}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4" onSubmit={submit} noValidate>
        <Input label={t("org.pointName")} required error={er.name?.message} {...form.register("name")} />
        {wards.length ? (
          <Select label={t("org.ward")} required placeholder={t("common.select")} options={wards} error={er.ward?.message} {...form.register("ward")} />
        ) : (
          <Input label={t("org.ward")} required error={er.ward?.message} {...form.register("ward")} />
        )}
        <Input label={t("org.area")} optionalLabel={t("common.optional")} {...form.register("area")} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("org.latitude")} optionalLabel={t("common.optional")} inputMode="decimal" error={er.latitude?.message} {...form.register("latitude")} />
          <Input label={t("org.longitude")} optionalLabel={t("common.optional")} inputMode="decimal" error={er.longitude?.message} {...form.register("longitude")} />
        </div>
      </form>
    </Drawer>
  );
}

function RosterDrawer({ group, onClose }: { group: Group | null; onClose: () => void }) {
  const { t } = useI18n();
  const q = useApi<ListResponse<GroupMember>>(group ? `/groups/${group.id}/members` : null, { perPage: 100 });
  return (
    <Drawer open={group !== null} onClose={onClose} title={group?.name ?? ""} description={t("org.rosterHint")}>
      {q.isPending ? (
        <SkeletonRows rows={5} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data?.data.length ? (
        <EmptyState title={t("org.noMembers")} />
      ) : (
        <ul className="divide-y divide-line">
          {q.data.data.map((m) => (
            <li key={m.membershipId} className="flex items-center justify-between gap-2 py-3">
              <Link href={`/riders/${m.personId}`} className="min-w-0">
                <span className="block truncate font-semibold text-ink hover:underline">{m.legalName}</span>
                <span className="font-mono text-xs text-muted">
                  {m.systemId} {m.phoneMasked ? `· ${m.phoneMasked}` : ""}
                </span>
              </Link>
              <StatusPill status={m.profileStatus} />
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
