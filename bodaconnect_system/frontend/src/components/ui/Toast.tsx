"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { AlertOctagon, CheckCircle2, Info, X } from "lucide-react";
import { useI18n } from "@/i18n";
import { ApiError } from "@/lib/api";
import { cn } from "./cn";

type ToastKind = "success" | "error" | "info";

interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  requestId?: string;
}

interface ToastApi {
  push: (t: Omit<ToastItem, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (err: unknown, fallbackTitle?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [items, setItems] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);

  const push = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = ++seq;
      setItems((xs) => [...xs.slice(-3), { ...toast, id }]);
      setTimeout(() => dismiss(id), toast.kind === "error" ? 9000 : 5000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, message) => push({ kind: "success", title, message }),
      error: (err, fallbackTitle) => {
        if (err instanceof ApiError) {
          push({
            kind: "error",
            title: err.isNetwork ? t("error.offlineTitle") : fallbackTitle ?? t("error.title"),
            message: err.isNetwork ? t("error.offlineBody") : err.message,
            requestId: err.requestId,
          });
        } else {
          push({ kind: "error", title: fallbackTitle ?? t("error.title"), message: t("error.body") });
        }
      },
    }),
    [push, t],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-relevant="additions"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6"
      >
        {items.map((it) => (
          <div
            key={it.id}
            role={it.kind === "error" ? "alert" : "status"}
            className={cn(
              "bc-animate-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[16px] border bg-white p-4 shadow-float",
              it.kind === "error" ? "border-danger/30" : it.kind === "success" ? "border-mint" : "border-info/30",
            )}
          >
            <span className={cn("mt-0.5", it.kind === "error" ? "text-danger" : it.kind === "success" ? "text-brand" : "text-info")}>
              {it.kind === "error" ? <AlertOctagon className="size-5" aria-hidden /> : it.kind === "success" ? <CheckCircle2 className="size-5" aria-hidden /> : <Info className="size-5" aria-hidden />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">{it.title}</p>
              {it.message && <p className="mt-0.5 text-sm text-muted">{it.message}</p>}
              {it.requestId && (
                <p className="mt-1.5 text-xs text-muted">
                  {t("error.requestId")}: <code className="font-mono select-all">{it.requestId}</code>
                </p>
              )}
            </div>
            <button type="button" onClick={() => dismiss(it.id)} aria-label={t("common.close")} className="-m-1 rounded-full p-1 text-muted hover:bg-surface">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
