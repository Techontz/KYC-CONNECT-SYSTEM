"use client";

import { useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { useI18n } from "@/i18n";
import { Button, ButtonLink } from "@/components/ui";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-[70dvh] flex-col items-center justify-center px-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-danger-50 text-danger">
        <AlertOctagon className="size-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-[26px] font-extrabold tracking-[-0.02em]">{t("error.title")}</h1>
      <p className="mt-2 max-w-md text-muted">{t("error.body")}</p>
      {error.digest && (
        <p className="mt-2 text-xs text-muted">
          {t("error.reference")}: <code className="font-mono">{error.digest}</code>
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Button onClick={reset} icon={<RefreshCw className="size-4" aria-hidden />}>
          {t("common.retry")}
        </Button>
        <ButtonLink href="/" variant="secondary">
          {t("error.goHome")}
        </ButtonLink>
      </div>
    </main>
  );
}
