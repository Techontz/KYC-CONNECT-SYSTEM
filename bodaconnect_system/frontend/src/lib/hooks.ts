"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { api, uuid, type QueryValue } from "./api";
import type { ItemResponse, Lookups, Me } from "./types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api<ItemResponse<Me>>("/me")).data,
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export function useLookups() {
  return useQuery({
    queryKey: ["lookups"],
    queryFn: async () => (await api<ItemResponse<Lookups>>("/lookups")).data,
    staleTime: 30 * 60_000,
  });
}

/** Generic GET hook. `path` null disables the query. */
export function useApi<T>(
  path: string | null,
  query?: Record<string, QueryValue>,
  options?: Omit<UseQueryOptions<T>, "queryKey" | "queryFn">,
) {
  return useQuery<T>({
    queryKey: [path, query ?? {}],
    queryFn: ({ signal }) => api<T>(path!, { query, signal }),
    enabled: path !== null && (options?.enabled ?? true),
    ...options,
  });
}

/**
 * Idempotency-Key per form submission attempt (US-10). The key is created on the first submit
 * and reused on retries after network/server failures; it is reset after success or a definitive
 * 4xx response (the user must change something, so the next submit is a new attempt).
 */
export function useIdempotencyKey() {
  const ref = useRef<string | null>(null);
  const get = useCallback(() => {
    if (!ref.current) ref.current = uuid();
    return ref.current;
  }, []);
  const reset = useCallback(() => {
    ref.current = null;
  }, []);
  return { get, reset };
}

export function useDebounced<T>(value: T, delay = 400): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return online;
}
