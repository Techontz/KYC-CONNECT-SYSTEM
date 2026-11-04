"use client";

import type { ReactNode } from "react";
import { AlertOctagon, RefreshCw, WifiOff } from "lucide-react";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api";
import { Button } from "./Button";
import { cn } from "./cn";

function Illustration({ kind }: { kind: "empty" | "error" | "search" }) {
  return (
    <svg viewBox="0 0 160 120" className="h-28 w-auto" aria-hidden>
      <ellipse cx="80" cy="104" rx="56" ry="8" fill="#EEF7F2" />
      <rect x="34" y="22" width="92" height="70" rx="14" fill="#fff" stroke="#E3E8E5" strokeWidth="2" />
      <rect x="46" y="36" width="44" height="7" rx="3.5" fill="#D6EDE3" />
      <rect x="46" y="50" width="68" height="6" rx="3" fill="#EEF7F2" />
      <rect x="46" y="62" width="56" height="6" rx="3" fill="#EEF7F2" />
      {kind === "error" ? (
        <g>
          <circle cx="118" cy="30" r="16" fill="#FDECEC" stroke="#D64545" strokeWidth="2" />
          <path d="M118 22v10M118 37v1" stroke="#D64545" strokeWidth="3" strokeLinecap="round" />
        </g>
      ) : kind === "search" ? (
        <g>
          <circle cx="114" cy="72" r="14" fill="#fff" stroke="#1F3E35" strokeWidth="3" />
          <path d="M124 82l10 10" stroke="#1F3E35" strokeWidth="4" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <circle cx="118" cy="30" r="16" fill="#39B54A" />
          <path d="M111 30l5 5 9-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
  kind = "empty",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  kind?: "empty" | "error" | "search";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-10 text-center", className)}>
      <Illustration kind={kind} />
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Standard error display with retry and the support request id. */
export function ErrorState({ error, onRetry, className }: { error: unknown; onRetry?: () => void; className?: string }) {
  const { t } = useI18n();
  const apiErr = error instanceof ApiError ? error : null;
  const offline = apiErr?.isNetwork;
  const notFound = apiErr?.status === 404;
  const title = offline ? t("error.offlineTitle") : notFound ? t("error.notFoundTitle") : apiErr?.status === 403 ? t("error.forbiddenTitle") : t("error.title");
  const message = offline ? t("error.offlineBody") : notFound ? t("error.notFoundBody") : apiErr?.message ?? t("error.body");
  return (
    <div role="alert" className={cn("flex flex-col items-center rounded-[20px] border border-line bg-white px-4 py-10 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-50 text-danger">
        {offline ? <WifiOff className="size-6" aria-hidden /> : <AlertOctagon className="size-6" aria-hidden />}
      </span>
      <h3 className="mt-4 text-base font-bold text-ink">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted">{message}</p>
      {apiErr?.requestId && (
        <p className="mt-2 text-xs text-muted">
          {t("error.requestId")}: <code className="rounded bg-surface px-1.5 py-0.5 font-mono">{apiErr.requestId}</code>
        </p>
      )}
      {onRetry && !notFound && (
        <Button variant="secondary" className="mt-5" onClick={onRetry} icon={<RefreshCw className="size-4" aria-hidden />}>
          {t("common.retry")}
        </Button>
      )}
    </div>
  );
}
