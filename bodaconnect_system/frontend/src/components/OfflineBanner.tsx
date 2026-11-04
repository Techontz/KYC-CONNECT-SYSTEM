"use client";

import { WifiOff } from "lucide-react";
import { useI18n } from "@/i18n";
import { useOnline } from "@/lib/hooks";

/** PRD 8.1: data is never cached offline, so explain what is unavailable. */
export function OfflineBanner() {
  const online = useOnline();
  const { t } = useI18n();
  if (online) return null;
  return (
    <div role="status" className="sticky top-0 z-[80] flex items-start gap-3 bg-amber px-4 py-2.5 text-sm text-ink">
      <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        <strong className="font-bold">{t("offline.title")}</strong> {t("offline.body")}
      </p>
    </div>
  );
}
