"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  Archive,
  BadgeCheck,
  Ban,
  CheckCircle2,
  Circle,
  Clock,
  FileEdit,
  Hourglass,
  Info,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import { useI18n } from "@/i18n";
import { humanize } from "@/lib/format";
import { cn } from "./cn";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

const tones: Record<Tone, string> = {
  neutral: "bg-surface text-ink border-line",
  success: "bg-mint-50 text-success-900 border-mint",
  warning: "bg-amber-50 text-amber-900 border-amber/40",
  danger: "bg-danger-50 text-danger-900 border-danger/30",
  info: "bg-info-50 text-info-900 border-info/30",
  brand: "bg-mint text-forest border-mint",
};

export function Badge({ tone = "neutral", icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {icon}
      <span className="truncate">{children}</span>
    </span>
  );
}

const ic = "size-3.5 shrink-0";

const statusMap: Record<string, { tone: Tone; icon: ReactNode }> = {
  draft: { tone: "neutral", icon: <FileEdit className={ic} aria-hidden /> },
  submitted: { tone: "info", icon: <Send className={ic} aria-hidden /> },
  under_review: { tone: "info", icon: <Search className={ic} aria-hidden /> },
  verified: { tone: "success", icon: <BadgeCheck className={ic} aria-hidden /> },
  correction_required: { tone: "warning", icon: <AlertTriangle className={ic} aria-hidden /> },
  rejected: { tone: "danger", icon: <XCircle className={ic} aria-hidden /> },
  archived: { tone: "neutral", icon: <Archive className={ic} aria-hidden /> },
  open: { tone: "warning", icon: <Circle className={ic} aria-hidden /> },
  in_progress: { tone: "info", icon: <Hourglass className={ic} aria-hidden /> },
  resolved: { tone: "success", icon: <CheckCircle2 className={ic} aria-hidden /> },
  confirmed_duplicate: { tone: "danger", icon: <XCircle className={ic} aria-hidden /> },
  not_duplicate: { tone: "success", icon: <CheckCircle2 className={ic} aria-hidden /> },
  active: { tone: "success", icon: <CheckCircle2 className={ic} aria-hidden /> },
  disabled: { tone: "danger", icon: <Ban className={ic} aria-hidden /> },
  ended: { tone: "neutral", icon: <Clock className={ic} aria-hidden /> },
  pending: { tone: "info", icon: <Hourglass className={ic} aria-hidden /> },
  granted: { tone: "success", icon: <CheckCircle2 className={ic} aria-hidden /> },
  withdrawn: { tone: "neutral", icon: <Ban className={ic} aria-hidden /> },
  unverified: { tone: "neutral", icon: <Info className={ic} aria-hidden /> },
  ready: { tone: "success", icon: <CheckCircle2 className={ic} aria-hidden /> },
  expired: { tone: "neutral", icon: <Clock className={ic} aria-hidden /> },
};

/** Status is always conveyed by icon + text, never colour alone. */
export function StatusPill({ status, className }: { status?: string | null; className?: string }) {
  const { tx } = useI18n();
  const key = status ?? "unverified";
  const s = statusMap[key] ?? { tone: "neutral" as Tone, icon: <Info className={ic} aria-hidden /> };
  return (
    <Badge tone={s.tone} icon={s.icon} className={className}>
      {tx(`status.${key}`, humanize(key))}
    </Badge>
  );
}
