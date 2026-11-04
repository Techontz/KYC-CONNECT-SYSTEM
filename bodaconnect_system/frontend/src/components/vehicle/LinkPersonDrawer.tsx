"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n";
import { ApiError, api } from "@/lib/api";
import { useApi, useDebounced, useIdempotencyKey } from "@/lib/hooks";
import type { ID, ListResponse, RelationshipType, RiderListItem } from "@/lib/types";
import { Button, Drawer, Input, RadioCard, StatusPill, cn, useToast } from "@/components/ui";

/** Links a person to a vehicle as owner / operator / keeper. Pass `personId` to skip the person search. */
export function LinkPersonDrawer({
  open,
  onClose,
  vehicleId,
  personId,
  personLabel,
  onLinked,
}: {
  open: boolean;
  onClose: () => void;
  vehicleId: ID | null;
  personId?: ID | null;
  personLabel?: string;
  onLinked?: () => void;
}) {
  const { t, tx } = useI18n();
  const toast = useToast();
  const qc = useQueryClient();
  const idem = useIdempotencyKey();
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<{ id: ID; name: string } | null>(null);
  const [type, setType] = useState<RelationshipType>("operator");
  const [startAt, setStartAt] = useState("");
  const dq = useDebounced(query, 350);
  const search = useApi<ListResponse<RiderListItem>>(open && !personId && dq.trim().length >= 2 ? "/riders" : null, { q: dq.trim(), perPage: 8 });
  const target = personId ? { id: personId, name: personLabel ?? String(personId) } : picked;

  const m = useMutation({
    mutationFn: () =>
      api(`/vehicles/${vehicleId}/relationships`, {
        method: "POST",
        idempotencyKey: idem.get(),
        body: { personId: target!.id, relationshipType: type, startAt: startAt || undefined },
      }),
    onSuccess: () => {
      idem.reset();
      toast.success(t("vehicle.linked"));
      qc.invalidateQueries({ queryKey: [`/vehicles/${vehicleId}`] });
      qc.invalidateQueries({ queryKey: ["/vehicles"] });
      if (target) qc.invalidateQueries({ queryKey: [`/riders/${target.id}`] });
      setPicked(null);
      setQuery("");
      onLinked?.();
      onClose();
    },
    onError: (e) => {
      if (e instanceof ApiError && e.isDefinitive) idem.reset();
      toast.error(e);
    },
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={t("vehicle.linkPerson")}
      description={t("vehicle.linkPersonHint")}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button onClick={() => m.mutate()} disabled={!target || !vehicleId} loading={m.isPending}>
            {t("vehicle.link")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5">
        {personId ? (
          <p className="rounded-[12px] bg-mint-50 p-3 text-sm">
            {t("vehicle.linkingPerson")}: <strong>{personLabel}</strong>
          </p>
        ) : (
          <div>
            <Input label={t("vehicle.findPerson")} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("search.placeholder")} />
            <ul className="mt-2 grid grid-cols-1 gap-1.5" aria-live="polite">
              {search.data?.data.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    aria-pressed={picked?.id === r.id}
                    onClick={() => setPicked({ id: r.id, name: r.legalName })}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between gap-2 rounded-[12px] border px-3 py-2 text-left",
                      picked?.id === r.id ? "border-brand bg-mint-50" : "border-line hover:border-muted/40",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{r.legalName}</span>
                      <span className="font-mono text-xs text-muted">{r.systemId}</span>
                    </span>
                    <StatusPill status={r.profileStatus} />
                  </button>
                </li>
              ))}
              {search.data && !search.data.data.length && <li className="text-sm text-muted">{t("roster.noMatches")}</li>}
              {!search.data && query.length > 0 && query.length < 2 && <li className="text-sm text-muted">{t("search.minChars")}</li>}
            </ul>
            {!query && <p className="mt-2 text-sm text-muted">{t("search.minChars")}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label={t("vehicle.relationship")}>
          <p className="text-sm font-semibold">{t("vehicle.relationship")}</p>
          {(["owner", "operator", "keeper"] as const).map((rt) => (
            <RadioCard key={rt} name="rel" value={rt} checked={type === rt} onChange={() => setType(rt)} title={tx(`relationship.${rt}`, rt)} description={tx(`relationshipDesc.${rt}`, "")} />
          ))}
          <p className="text-[13px] text-muted">{t("vehicle.replaceNote")}</p>
        </div>
        <Input label={t("vehicle.startAt")} type="date" optionalLabel={t("common.optional")} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
      </div>
    </Drawer>
  );
}
