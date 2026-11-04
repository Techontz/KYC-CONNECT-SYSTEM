"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellDot, Megaphone } from "lucide-react";
import { useI18n } from "@/i18n";
import { ApiError, api, applyFieldErrors } from "@/lib/api";
import { useApi, useIdempotencyKey, useMe } from "@/lib/hooks";
import { useOrganisations } from "@/lib/orgs";
import { hasRole, primaryOrganisation } from "@/lib/roles";
import { formatDateTime } from "@/lib/format";
import type { ListResponse, Notification } from "@/lib/types";
import { Button, Card, Drawer, EmptyState, ErrorState, Input, PageHeader, Pagination, Select, SkeletonRows, Textarea, cn, useToast } from "@/components/ui";

export default function NoticesPage() {
  const { t, lang } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const me = useMe();
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const q = useApi<ListResponse<Notification>>("/notifications", { page, perPage: 20 });
  const canAnnounce = hasRole(me.data, "association_admin", "platform_admin");

  const read = useMutation({
    mutationFn: (id: Notification["id"]) => api(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/notifications"] }),
    onError: (e) => toast.error(e),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow={t("notices.eyebrow")}
        title={t("notices.title")}
        description={t("notices.subtitle")}
        actions={
          canAnnounce ? (
            <Button icon={<Megaphone className="size-4" aria-hidden />} onClick={() => setOpen(true)}>
              {t("notices.announce")}
            </Button>
          ) : undefined
        }
      />
      {q.isPending ? (
        <SkeletonRows rows={5} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !q.data.data.length ? (
        <Card>
          <EmptyState title={t("notices.empty")} description={t("notices.emptyHint")} />
        </Card>
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-2">
            {q.data.data.map((n) => {
              const unread = !n.readAt;
              return (
                <li key={n.id}>
                  <Card className={cn("flex gap-3 p-4", unread && "border-brand/40 bg-mint-50/40")}>
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", unread ? "bg-brand text-white" : "bg-surface text-muted")}>
                      {unread ? <BellDot className="size-5" aria-hidden /> : <Bell className="size-5" aria-hidden />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-ink">{n.title}</p>
                        {unread && <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-bold text-white">{t("notices.new")}</span>}
                      </div>
                      {n.body && <p className="mt-1 whitespace-pre-line text-sm text-ink">{n.body}</p>}
                      <p className="mt-1 text-xs text-muted">
                        {formatDateTime(n.createdAt, lang)}
                        {n.organisationName ? ` · ${n.organisationName}` : ""}
                      </p>
                    </div>
                    {unread && (
                      <Button size="sm" variant="ghost" className="self-start" loading={read.isPending && read.variables === n.id} onClick={() => read.mutate(n.id)}>
                        {t("notices.markRead")}
                      </Button>
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
          <Pagination meta={q.data.meta} onPage={setPage} />
        </>
      )}
      {canAnnounce && <AnnounceDrawer open={open} onClose={() => setOpen(false)} />}
    </div>
  );
}

function AnnounceDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const me = useMe();
  const orgs = useOrganisations();
  const idem = useIdempotencyKey();
  const isPlatform = hasRole(me.data, "platform_admin");
  const schema = z.object({
    title: z.string().trim().min(3, t("validation.required")).max(120),
    body: z.string().trim().min(5, t("validation.required")).max(2000),
    organisationId: z.string().optional(),
  });
  type V = z.infer<typeof schema>;
  const form = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", organisationId: primaryOrganisation(me.data)?.id ? String(primaryOrganisation(me.data)!.id) : "" },
  });
  const m = useMutation({
    mutationFn: (v: V) =>
      api<{ data?: { recipients?: number } }>("/announcements", { method: "POST", idempotencyKey: idem.get(), body: { ...v, organisationId: v.organisationId || undefined } }),
    onSuccess: (res) => {
      idem.reset();
      toast.success(t("notices.sent"), res?.data?.recipients !== undefined ? t("notices.recipients", { n: res.data.recipients }) : undefined);
      qc.invalidateQueries({ queryKey: ["/notifications"] });
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
      title={t("notices.announce")}
      description={t("notices.announceHint")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} loading={m.isPending} icon={<Megaphone className="size-4" aria-hidden />}>
            {t("notices.send")}
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4" onSubmit={submit} noValidate>
        {isPlatform && (
          <Select
            label={t("notices.audience")}
            placeholder={t("notices.allOrgs")}
            options={(orgs.data?.data ?? []).map((o) => ({ value: String(o.id), label: o.name }))}
            {...form.register("organisationId")}
          />
        )}
        <Input label={t("notices.titleField")} required error={er.title?.message} {...form.register("title")} />
        <Textarea label={t("notices.body")} required rows={6} error={er.body?.message} {...form.register("body")} />
      </form>
    </Drawer>
  );
}
