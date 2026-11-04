/**
 * Typed browser-side API client. All calls go through the Next.js BFF (`/api/bff/*`), which adds
 * the bearer token from the HttpOnly `bc_session` cookie. The browser never sees the token.
 */
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string | string[]>;
    requestId?: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  status: number;
  code: string;
  fieldErrors: Record<string, string>;
  requestId?: string;
  details?: Record<string, unknown>;

  constructor(init: {
    status: number;
    code: string;
    message: string;
    fieldErrors?: Record<string, string | string[]>;
    requestId?: string;
    details?: Record<string, unknown>;
  }) {
    super(init.message);
    this.name = "ApiError";
    this.status = init.status;
    this.code = init.code;
    this.requestId = init.requestId;
    this.details = init.details;
    this.fieldErrors = {};
    for (const [k, v] of Object.entries(init.fieldErrors ?? {})) {
      this.fieldErrors[k] = Array.isArray(v) ? v.join(" ") : String(v);
    }
  }

  get isNetwork() {
    return this.code === "NETWORK_ERROR";
  }

  /** A definitive client error: the same request will not succeed if retried unchanged. */
  get isDefinitive() {
    return this.status >= 400 && this.status < 500 && this.status !== 408 && this.status !== 429;
  }
}

export type QueryValue = string | number | boolean | null | undefined;

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  form?: FormData;
  idempotencyKey?: string;
  signal?: AbortSignal;
}

const BFF = "/api/bff";

export function buildQuery(query?: Record<string, QueryValue>): string {
  if (!query) return "";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

function redirectToLogin() {
  if (typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.assign(`/login?next=${next}&expired=1`);
}

async function toApiError(res: Response): Promise<ApiError> {
  let envelope: Partial<ErrorEnvelope> | null = null;
  try {
    envelope = (await res.json()) as Partial<ErrorEnvelope>;
  } catch {
    envelope = null;
  }
  const e = envelope?.error;
  const legacy = envelope as unknown as { message?: string; errors?: Record<string, string[]> } | null;
  return new ApiError({
    status: res.status,
    code: e?.code ?? (res.status === 401 ? "UNAUTHENTICATED" : res.status >= 500 ? "SERVER_ERROR" : "ERROR"),
    message: e?.message ?? legacy?.message ?? `Request failed (${res.status})`,
    fieldErrors: e?.fieldErrors ?? legacy?.errors,
    requestId: e?.requestId ?? res.headers.get("x-request-id") ?? undefined,
    details: e?.details,
  });
}

async function rawRequest(path: string, opts: RequestOptions = {}): Promise<Response> {
  const method = opts.method ?? (opts.body !== undefined || opts.form ? "POST" : "GET");
  const headers: Record<string, string> = { Accept: "application/json" };
  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  if (opts.idempotencyKey) headers["Idempotency-Key"] = opts.idempotencyKey;

  let res: Response;
  try {
    res = await fetch(`${BFF}${path.startsWith("/") ? path : `/${path}`}${buildQuery(opts.query)}`, {
      method,
      headers,
      body,
      credentials: "same-origin",
      cache: "no-store",
      signal: opts.signal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiError({ status: 0, code: "NETWORK_ERROR", message: "network" });
  }
  if (res.status === 401) {
    const apiErr = await toApiError(res);
    redirectToLogin();
    throw apiErr;
  }
  if (!res.ok) throw await toApiError(res);
  return res;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await rawRequest(path, opts);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (star) return decodeURIComponent(star[1].trim().replace(/"/g, ""));
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : null;
}

/** Downloads a protected file through the BFF (Content-Disposition is passed through). */
export async function downloadFile(path: string, fallbackName = "download"): Promise<void> {
  const res = await rawRequest(path, { method: "GET" });
  const blob = await res.blob();
  const name = filenameFromDisposition(res.headers.get("content-disposition")) ?? fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** Opens a protected file (e.g. an evidence image/PDF) as an object URL for inline preview. */
export async function fetchBlobUrl(path: string): Promise<{ url: string; type: string }> {
  const res = await rawRequest(path, { method: "GET" });
  const blob = await res.blob();
  return { url: URL.createObjectURL(blob), type: blob.type };
}

/** Maps `fieldErrors` from the error envelope onto react-hook-form fields. Returns true if any mapped. */
export function applyFieldErrors<T extends FieldValues>(
  err: unknown,
  setError: UseFormSetError<T>,
  knownFields?: readonly string[],
): boolean {
  if (!(err instanceof ApiError)) return false;
  let mapped = false;
  for (const [field, message] of Object.entries(err.fieldErrors)) {
    if (knownFields && !knownFields.includes(field)) continue;
    setError(field as Path<T>, { type: "server", message });
    mapped = true;
  }
  return mapped;
}

/** RFC 4122 v4 uuid; falls back when crypto.randomUUID is unavailable (non-secure LAN origins). */
export function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
