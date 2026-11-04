"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nProvider } from "@/i18n";
import { ToastProvider } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { OfflineBanner } from "./OfflineBanner";

function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (process.env.NODE_ENV !== "production") {
    // Avoid stale caches during development.
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    return;
  }
  navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (count, err) => {
              if (err instanceof ApiError && (err.isDefinitive || err.isNetwork)) return false;
              return count < 2;
            },
          },
          mutations: { retry: false },
        },
      }),
  );

  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={client}>
      <I18nProvider>
        <ToastProvider>
          <OfflineBanner />
          {children}
        </ToastProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
