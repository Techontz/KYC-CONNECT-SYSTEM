"use client";

import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/i18n";

export function Disclaimer() {
  const { t } = useI18n();
  return (
    <aside className="flex items-start gap-3 rounded-[16px] border border-info/25 bg-info-50 p-4 text-sm text-info-900" aria-label={t("disclaimer.label")}>
      <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p>
        <strong className="font-bold">{t("disclaimer.title")}</strong> {t("disclaimer.body")}
      </p>
    </aside>
  );
}
