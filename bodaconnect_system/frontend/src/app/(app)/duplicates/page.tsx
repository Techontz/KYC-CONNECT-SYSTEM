"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, CheckCircle2, XCircle } from "lucide-react";
import { useI18n } from "@/i18n";
import { api } from "@/lib/api";
import { useApi, useMe } from "@/lib/hooks";
import { hasRole } from "@/lib/roles";
import { formatDateTime, humanize } from "@/lib/format";
import type { DuplicateFlag, ListResponse, PersonRef } from "@/lib/types";
import { Badge, Button, Card, EmptyState, ErrorState, Modal, PageHeader, RadioCard, SkeletonRows, StatusPill, Textarea, useToast } from "@/components/ui";

function PersonBox({ p, label }: { p?: PersonRef | null; label: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-[16px] bg-surface p-4">
      <p className="text-xs font-semibold tracking-wide text-muted uppercase">{label}</p>
      {p ? (
        <Link href={`/riders/${p.id}`} className="mt-1 block">
          <span className="block truncate font-bold text-ink hover:underline">{p.legalName ?? "-"}</span>
          <span className="font-mono text-xs text-muted">{p.systemId}</span>
          {p.phoneMasked && <span className="block text-xs text-muted">{p.phoneMasked}</span>}
          {p.profileStatus && <StatusPill status={p.profileStatus} className="mt-1.5" />}
        </Link>
      ) : (
        <p className="text-sm text-muted">-</p>
      )}
    </div>
  );
}

export default function DuplicatesPage() {
  const { t, tx, lang } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const me = useMe();
  const q = useApi<ListResponse<DuplicateFlag>>("/duplicate-flags", { perPage: 50 });
  const [resolving, setResolving] = useState<DuplicateFlag | null>(null);
  const [resolution, setResolution] = useState<"confirmed_duplicate" | "not_duplicate">("not_duplicate");
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState<string | null>(null);
  const canResolve = hasRole(me.data, "verifier", "platform_admin", "association_admin");

  const m = useMutation({
    mutationFn: () => api(`/duplicate-flags/${resolving!.id}/resolve`, { method: "POST", body: { resolution, notes } }),
    onSuccess: () => {
      toast.success(t("duplicates.resolved"));
      setResolving(null);
      setNotes("");
      qc.invalidateQueries({ queryKey: ["/duplicate-flags"] });
      qc.invalidateQueries({ queryKey: ["/dashboard/summary"] });
    },
    onError: (e) => toast.error(e),
  });

  const flags = (q.data?.data ?? []).filter((f) => f.status === "open" || !f.status);

  return (
    <>
      <PageHeader eyebrow={t("duplicates.eyebrow")} title={t("duplicates.title")} description={t("duplicates.subtitle")} />
      {q.isPending ? (
        <SkeletonRows rows={4} />
      ) : q.isError ? (
        <ErrorState error={q.error} onRetry={() => q.refetch()} />
      ) : !flags.length ? (
        <Card>
          <EmptyState title={t("duplicates.none")} description={t("duplicates.noneHint")} />
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-3">
          {flags.map((f) => (
            <li key={f.id}>
              <Card className="p-4 sm:p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {(f.reasons ?? (f.reason ? [f.reason] : [])).map((r) => (
                    <Badge key={r} tone="warning">
                      {t("duplicates.matchedOn")}: {tx(`duplicateReason.${r}`, humanize(r))}
                    </Badge>
                  ))}
                  <span className="text-xs text-muted">{formatDateTime(f.createdAt, lang)}</span>
                </div>
                <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                  <PersonBox p={f.person} label={t("duplicates.newRecord")} />
                  <ArrowLeftRight className="mx-auto size-5 shrink-0 rotate-90 text-muted sm:rotate-0" aria-hidden />
                  <PersonBox p={f.matchedPerson} label={t("duplicates.existingRecord")} />
                </div>
                {canResolve && (
                  <div className="mt-4 flex justify-end">
                    <Button variant="secondary" onClick={() => setResolving(f)}>
                      {t("duplicates.resolve")}
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
      <Modal
        open={resolving !== null}
        onClose={() => setResolving(null)}
        title={t("duplicates.resolve")}
        description={t("duplicates.resolveHint")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setResolving(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              loading={m.isPending}
              onClick={() => {
                if (notes.trim().length < 5) return setNotesError(t("validation.reason"));
                setNotesError(null);
                m.mutate();
              }}
            >
              {t("common.save")}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-3">
          <RadioCard
            name="resolution"
            checked={resolution === "not_duplicate"}
            onChange={() => setResolution("not_duplicate")}
            icon={<CheckCircle2 className="size-5 text-brand" aria-hidden />}
            title={t("status.not_duplicate")}
            description={t("duplicates.notDuplicateDesc")}
          />
          <RadioCard
            name="resolution"
            checked={resolution === "confirmed_duplicate"}
            onChange={() => setResolution("confirmed_duplicate")}
            icon={<XCircle className="size-5 text-danger" aria-hidden />}
            title={t("status.confirmed_duplicate")}
            description={t("duplicates.confirmedDesc")}
          />
          <Textarea label={t("verification.notes")} required rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} error={notesError ?? undefined} />
          <p className="text-xs text-muted">{t("duplicates.neverMerge")}</p>
        </div>
      </Modal>
    </>
  );
}
