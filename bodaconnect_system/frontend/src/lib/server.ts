import "server-only";
import { NextResponse, type NextRequest } from "next/server";

export const SESSION_COOKIE = "bc_session";
export const SESSION_MAX_AGE = 12 * 60 * 60; // 12h, matches Sanctum token expiry

export function apiBase(): string {
  const base = process.env.API_BASE_URL ?? "http://127.0.0.1:8010/api/v1";
  return base.replace(/\/+$/, "");
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function clearSession(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
}

/** Headers forwarded from the browser to Laravel. */
export function forwardHeaders(req: NextRequest, extra: Record<string, string> = {}): Headers {
  const h = new Headers();
  h.set("Accept", req.headers.get("accept") ?? "application/json");
  for (const name of ["content-type", "idempotency-key", "accept-language", "x-request-id"]) {
    const v = req.headers.get(name);
    if (v) h.set(name, v);
  }
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip");
  if (ip) h.set("X-Forwarded-For", ip);
  const ua = req.headers.get("user-agent");
  if (ua) h.set("User-Agent", ua);
  for (const [k, v] of Object.entries(extra)) h.set(k, v);
  return h;
}

export function gatewayError(message = "The BodaConnect service is unreachable. Please try again shortly.", status = 502) {
  return NextResponse.json(
    { error: { code: "SERVER_ERROR", message, requestId: `bff-${crypto.randomUUID()}` } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
