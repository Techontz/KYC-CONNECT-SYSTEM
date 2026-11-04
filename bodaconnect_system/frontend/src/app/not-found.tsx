"use client";

import { Compass } from "lucide-react";
import { useI18n } from "@/i18n";
import { ButtonLink } from "@/components/ui";
import { Logo } from "@/components/shell/Logo";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-surface px-4 text-center">
      <Logo className="mb-10" />
      <span className="flex size-16 items-center justify-center rounded-full bg-mint text-forest">
        <Compass className="size-8" aria-hidden />
      </span>
      <p className="mt-6 text-sm font-bold tracking-widest text-brand">404</p>
      <h1 className="mt-2 text-[28px] font-extrabold tracking-[-0.02em]">{t("error.pageNotFound")}</h1>
      <p className="mt-2 max-w-md text-muted">{t("error.pageNotFoundBody")}</p>
      <ButtonLink href="/" className="mt-8">
        {t("error.goHome")}
      </ButtonLink>
    </main>
  );
}
