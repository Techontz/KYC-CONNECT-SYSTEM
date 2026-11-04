"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, Building2, CheckCircle2, Plus, ScrollText, Search, ShieldPlus, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { ApiError, api, applyFieldErrors } from "@/lib/api";
import { useApi, useIdempotencyKey, useLookups, useMe } from "@/lib/hooks";
import { useGroups, useOrganisations } from "@/lib/orgs";
import { hasRole, primaryOrganisation } from "@/lib/roles";
import { formatDateTime, humanize, normalisePhone, toOptions, TZ_PHONE_RE } from "@/lib/format";
import type { ListResponse, RoleAssignment, RoleKey, User } from "@/lib/types";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  ConfirmModal,
  Drawer,
  EmptyState,
  ErrorState,
  Input,
  PageHeader,
  Pagination,
  Select,
  SkeletonRows,
  StatusPill,
  TabPanel,
  Tabs,
  useToast,
} from "@/components/ui";

const ROLES: RoleKey[] = ["platform_admin", "verifier", "field_agent", "association_admin", "group_leader", "rider", "owner"];
const ORG_SCOPED: RoleKey[] = ["field_agent", "association_admin", "group_leader"];

export default function AdminPage() {
  const { t } = useI18n();
  const me = useMe();
  const [tab, setTab] = useState("users");
  const isPlatform = hasRole(me.data, "platform_admin");
  const items = [
    { key: "users", label: t("admin.users") },
    ...(isPlatform ? [{ key: "orgs", label: t("admin.organisations") }] : []),
    { key: "lookups", label: t("admin.lookups") },
  ];
  return (
    <>
      <PageHeader
        eyebrow={t("admin.eyebrow")}
        title={t("admin.title")}
        description={t("admin.subtitle")}
        actions={
          isPlatform ? (
            <ButtonLink href="/admin/audit" variant="secondary" icon={<ScrollText className="size-4" aria-hidden />}>
              {t("nav.audit")}
            </ButtonLink>
          ) : undefined
        }
      />
      <Card className="p-4 sm:p-6">
        <Tabs idBase="admin" items={items} value={tab} onChange={setTab} />
        <TabPanel idBase="admin" tabKey={tab}>
          {tab === "users" && <UsersTab />}
          {tab === "orgs" && isPlatform && <OrganisationsTab />}
          {tab === "lookups" && <LookupsTab />}
        </TabPanel>
      </Card>
    </>
  );
}

function roleLabel(r: RoleAssignment, tx: (k: string, f?: string) => string) {
  const scope = r.groupName ?? r.organisationName;
  return `${tx(`role.${r.role}`, r.roleLabel ?? r.role)}${scope ? ` · ${scope}` : ""}`;
}

function UsersTab() {
  const { t, tx, lang } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const list = useApi<ListResponse<User>>("/users", { q: search, page, perPage: 25 }, { placeholderData: (p) => p });
  const [createOpen, setCreateOpen] = useState(false);
  const [grantFor, setGrantFor] = useState<User | null>(null);
  const [revoke, setRevoke] = useState<{ user: User; role: RoleAssignment } | null>(null);
  const [toggle, setToggle] = useState<User | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["/users"] });
  const revokeM = useMutation({
    mutationFn: (id: RoleAssignment["id"]) => api(`/role-assignments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success(t("admin.roleRevoked"));
      setRevoke(null);
      invalidate();
    },
    onError: (e) => toast.error(e),
  });
  const toggleM = useMutation({
    mutationFn: (u: User) => api(`/users/${u.id}/${u.status === "disabled" ? "enable" : "disable"}`, { method: "POST" }),
    onSuccess: (_d, u) => {
      toast.success(u.status === "disabled" ? t("admin.enabled") : t("admin.disabled"));
      setToggle(null);
      invalidate();
    },
    onError: (e) => toast.error(e),
  });

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    setSearch(q.trim());
    setPage(1);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <form onSubmit={onSearch} role="search" className="flex min-w-0 flex-1 gap-2">
          <label htmlFor="user-q" className="sr-only">
            {t("admin.searchUsers")}
          </label>
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="user-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("admin.searchUsers")}
              className="min-h-11 w-full rounded-[12px] border border-line pl-10 pr-3 focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/20"
            />
          </div>
          <Button type="submit" variant="dark">
            {t("common.search")}
          </Button>
        </form>
        <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setCreateOpen(true)}>
          {t("admin.newUser")}
        </Button>
      </div>
      {list.isPending ? (
        <SkeletonRows rows={5} />
      ) : list.isError ? (
        <ErrorState error={list.error} onRetry={() => list.refetch()} />
      ) : !list.data.data.length ? (
        <EmptyState kind="search" title={t("admin.noUsers")} />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-2">
            {list.data.data.map((u) => {
              const roles = (u.roles ?? []).filter((r) => !r.revokedAt);
              return (
                <li key={u.id} className="rounded-[16px] border border-line p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-ink">{u.displayName ?? u.legalName ?? u.name ?? u.person?.legalName ?? u.phoneE164}</p>
                      <p className="text-sm text-muted">
                        <span className="font-mono">{u.phoneE164}</span>
                        {u.lastLoginAt ? ` · ${t("admin.lastLogin", { date: formatDateTime(u.lastLoginAt, lang) })}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={u.status === "disabled" ? "disabled" : "active"} />
                      <Button size="sm" variant="ghost" icon={<ShieldPlus className="size-4" aria-hidden />} onClick={() => setGrantFor(u)}>
                        {t("admin.grantRole")}
                      </Button>
                      <Button
                        size="sm"
                        variant={u.status === "disabled" ? "secondary" : "ghost"}
                        icon={u.status === "disabled" ? <CheckCircle2 className="size-4" aria-hidden /> : <Ban className="size-4" aria-hidden />}
                        onClick={() => setToggle(u)}
                      >
                        {u.status === "disabled" ? t("admin.enable") : t("admin.disable")}
                      </Button>
                    </div>
                  </div>
                  <ul className="mt-3 flex flex-wrap gap-1.5" aria-label={t("admin.roles")}>
                    {roles.length ? (
                      roles.map((r, i) => (
                        <li key={r.id ?? i}>
                          <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-xs font-semibold text-forest">
                            {roleLabel(r, tx)}
                            {r.id !== undefined && (
                              <button
                                type="button"
                                onClick={() => setRevoke({ user: u, role: r })}
                                className="-mr-1 inline-flex size-6 items-center justify-center rounded-full hover:bg-white/60"
                                aria-label={`${t("admin.revoke")}: ${roleLabel(r, tx)}`}
                              >
                                <X className="size-3.5" aria-hidden />
                              </button>
                            )}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted">{t("admin.noRoles")}</li>
                    )}
                  </ul>
                </li>
              );
            })}
          </ul>
          <Pagination meta={list.data.meta} onPage={setPage} />
        </>
      )}
      <CreateUserDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <GrantRoleDrawer user={grantFor} onClose={() => setGrantFor(null)} />
      <ConfirmModal
        open={revoke !== null}
        onClose={() => setRevoke(null)}
        onConfirm={() => revoke && revokeM.mutate(revoke.role.id)}
        loading={revokeM.isPending}
        tone="danger"
        title={t("admin.revokeTitle")}
        description={revoke ? t("admin.revokeBody", { role: roleLabel(revoke.role, tx), name: revoke.user.displayName ?? revoke.user.legalName ?? revoke.user.phoneE164 }) : undefined}
        confirmLabel={t("admin.revoke")}
      />
      <ConfirmModal
        open={toggle !== null}
        onClose={() => setToggle(null)}
        onConfirm={() => toggle && toggleM.mutate(toggle)}
        loading={toggleM.isPending}
        tone={toggle?.status === "disabled" ? "primary" : "danger"}
        title={toggle?.status === "disabled" ? t("admin.enableTitle") : t("admin.disableTitle")}
        description={toggle?.status === "disabled" ? t("admin.enableBody") : t("admin.disableBody")}
        confirmLabel={toggle?.status === "disabled" ? t("admin.enable") : t("admin.disable")}
      />
    </div>
  );
}

function RoleScopeFields({
  role,
  orgId,
  register,
  errors,
}: {
  role: string;
  orgId: string;
  register: ReturnType<typeof useForm<{ role: string; organisationId?: string; groupId?: string }>>["register"];
  errors: { organisationId?: { message?: string }; groupId?: { message?: string } };
}) {
  const { t } = useI18n();
  const orgs = useOrganisations();
  const groups = useGroups(role === "group_leader" && orgId ? orgId : null);
  if (!ORG_SCOPED.includes(role as RoleKey)) return null;
  return (
    <>
      <Select label={t("rider.organisation")} required placeholder={t("common.select")} options={(orgs.data?.data ?? []).map((o) => ({ value: String(o.id), label: o.name }))} error={errors.organisationId?.message} {...register("organisationId")} />
      {role === "group_leader" && (
        <Select label={t("rider.group")} required placeholder={t("common.select")} options={(groups.data?.data ?? []).map((g) => ({ value: String(g.id), label: g.name }))} error={errors.groupId?.message} {...register("groupId")} />
      )}
    </>
  );
}

function useRoleOptions() {
  const { tx } = useI18n();
  const me = useMe();
  const isPlatform = hasRole(me.data, "platform_admin");
  // Association admins can only grant roles inside their organisation.
  const allowed = isPlatform ? ROLES : (["field_agent", "group_leader", "rider", "owner"] as RoleKey[]);
  return allowed.map((r) => ({ value: r, label: tx(`role.${r}`, r) }));
}

function scopeRefine(t: (k: "validation.required") => string) {
  return (v: { role: string; organisationId?: string; groupId?: string }, ctx: z.RefinementCtx) => {
    if (ORG_SCOPED.includes(v.role as RoleKey) && !v.organisationId) ctx.addIssue({ code: "custom", path: ["organisationId"], message: t("validation.required") });
    if (v.role === "group_leader" && !v.groupId) ctx.addIssue({ code: "custom", path: ["groupId"], message: t("validation.required") });
  };
}

function GrantRoleDrawer({ user, onClose }: { user: User | null; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const me = useMe();
  const options = useRoleOptions();
  const schema = z.object({ role: z.string().min(1, t("validation.required")), organisationId: z.string().optional(), groupId: z.string().optional() }).superRefine(scopeRefine(t));
  type V = z.infer<typeof schema>;
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { role: "", organisationId: primaryOrganisation(me.data)?.id ? String(primaryOrganisation(me.data)!.id) : "", groupId: "" } });
  const role = form.watch("role");
  const orgId = form.watch("organisationId") ?? "";
  const m = useMutation({
    mutationFn: (v: V) => api(`/users/${user!.id}/roles`, { method: "POST", body: { role: v.role, organisationId: v.organisationId || undefined, groupId: v.groupId || undefined } }),
    onSuccess: () => {
      toast.success(t("admin.roleGranted"));
      qc.invalidateQueries({ queryKey: ["/users"] });
      form.reset();
      onClose();
    },
    onError: (e) => {
      applyFieldErrors(e, form.setError);
      toast.error(e);
    },
  });
  const submit = form.handleSubmit((v) => m.mutate(v));
  return (
    <Drawer
      open={user !== null}
      onClose={onClose}
      title={t("admin.grantRole")}
      description={user ? (user.displayName ?? user.legalName ?? user.phoneE164) : undefined}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} loading={m.isPending}>
            {t("admin.grantRole")}
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4" onSubmit={submit} noValidate>
        <Select label={t("admin.role")} required placeholder={t("common.select")} options={options} error={form.formState.errors.role?.message} {...form.register("role")} />
        <RoleScopeFields role={role} orgId={orgId} register={form.register} errors={form.formState.errors} />
        <p className="text-[13px] text-muted">{t("admin.leastPrivilege")}</p>
      </form>
    </Drawer>
  );
}

function CreateUserDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const me = useMe();
  const idem = useIdempotencyKey();
  const options = useRoleOptions();
  const schema = z
    .object({
      phoneNumber: z.string().trim().refine((v) => TZ_PHONE_RE.test(normalisePhone(v)), t("login.phoneInvalid")),
      legalName: z.string().trim().min(3, t("validation.legalName")),
      role: z.string().min(1, t("validation.required")),
      organisationId: z.string().optional(),
      groupId: z.string().optional(),
    })
    .superRefine(scopeRefine(t));
  type V = z.infer<typeof schema>;
  const form = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: { phoneNumber: "", legalName: "", role: "", organisationId: primaryOrganisation(me.data)?.id ? String(primaryOrganisation(me.data)!.id) : "", groupId: "" },
  });
  const role = form.watch("role");
  const orgId = form.watch("organisationId") ?? "";
  const m = useMutation({
    mutationFn: (v: V) =>
      api("/users", {
        method: "POST",
        idempotencyKey: idem.get(),
        body: { phoneNumber: normalisePhone(v.phoneNumber), legalName: v.legalName, roles: [{ role: v.role, organisationId: v.organisationId || undefined, groupId: v.groupId || undefined }] },
      }),
    onSuccess: () => {
      idem.reset();
      toast.success(t("admin.userCreated"));
      qc.invalidateQueries({ queryKey: ["/users"] });
      form.reset();
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
      open={open}
      onClose={onClose}
      title={t("admin.newUser")}
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
        <Input label={t("rider.legalName")} required error={er.legalName?.message} {...form.register("legalName")} />
        <Input label={t("rider.phone")} required type="tel" error={er.phoneNumber?.message} {...form.register("phoneNumber")} />
        <Select label={t("admin.role")} required placeholder={t("common.select")} options={options} error={er.role?.message} {...form.register("role")} />
        <RoleScopeFields role={role} orgId={orgId} register={form.register as never} errors={er} />
      </form>
    </Drawer>
  );
}

function OrganisationsTab() {
  const { t, tx } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const orgs = useOrganisations();
  const idem = useIdempotencyKey();
  const [open, setOpen] = useState(false);
  const schema = z.object({ name: z.string().trim().min(3, t("validation.required")), type: z.string().min(1, t("validation.required")) });
  type V = z.infer<typeof schema>;
  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { name: "", type: "association" } });
  const m = useMutation({
    mutationFn: (v: V) => api("/organisations", { method: "POST", body: v, idempotencyKey: idem.get() }),
    onSuccess: () => {
      idem.reset();
      toast.success(t("common.saved"));
      qc.invalidateQueries({ queryKey: ["/organisations"] });
      form.reset();
      setOpen(false);
    },
    onError: (e) => {
      if (e instanceof ApiError && e.isDefinitive) idem.reset();
      applyFieldErrors(e, form.setError);
      toast.error(e);
    },
  });
  const submit = form.handleSubmit((v) => m.mutate(v));
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button icon={<Plus className="size-4" aria-hidden />} onClick={() => setOpen(true)}>
          {t("admin.newOrganisation")}
        </Button>
      </div>
      {orgs.isPending ? (
        <SkeletonRows rows={3} />
      ) : orgs.isError ? (
        <ErrorState error={orgs.error} onRetry={() => orgs.refetch()} />
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {orgs.data.data.map((o) => (
            <li key={o.id}>
              <Link href={`/organisations/${o.id}`} className="flex items-center gap-3 rounded-[16px] border border-line p-4 hover:border-brand">
                <Building2 className="size-5 text-forest" aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{o.name}</span>
                  <span className="text-sm text-muted">{o.type ? tx(`orgType.${o.type}`, o.type) : ""}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={t("admin.newOrganisation")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={submit} loading={m.isPending}>
              {t("common.save")}
            </Button>
          </>
        }
      >
        <form className="grid grid-cols-1 gap-4" onSubmit={submit} noValidate>
          <Input label={t("admin.orgName")} required error={form.formState.errors.name?.message} {...form.register("name")} />
          <Select label={t("admin.orgType")} required options={["association", "platform", "partner"].map((v) => ({ value: v, label: tx(`orgType.${v}`, v) }))} {...form.register("type")} />
        </form>
      </Drawer>
    </div>
  );
}

function LookupsTab() {
  const { t, tx, lang } = useI18n();
  const q = useLookups();
  if (q.isPending) return <SkeletonRows rows={4} />;
  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const groups = Object.entries(q.data ?? {}).filter(([, v]) => Array.isArray(v)) as [string, Parameters<typeof toOptions>[0]][];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {groups.map(([key, entries]) => (
        <section key={key} className="rounded-[16px] border border-line p-4">
          <h3 className="mb-2 text-sm font-bold">{tx(`lookup.${key}`, humanize(key))}</h3>
          <ul className="flex flex-wrap gap-1.5">
            {toOptions(entries, lang).map((o) => (
              <li key={o.value}>
                <Badge>{o.label}</Badge>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-sm text-muted md:col-span-2">{t("admin.lookupsReadOnly")}</p>
    </div>
  );
}
