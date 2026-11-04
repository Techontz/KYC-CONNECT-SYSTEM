import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, apiBase, forwardHeaders, gatewayError, sessionCookieOptions } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid request body." } }, { status: 400 });
  }
  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase()}/auth/otp/verify`, {
      method: "POST",
      headers: forwardHeaders(req, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return gatewayError();
  }

  const requestId = upstream.headers.get("x-request-id");
  let payload: { data?: { token?: string; user?: unknown } } & Record<string, unknown>;
  try {
    payload = await upstream.json();
  } catch {
    return gatewayError("Unexpected response from the BodaConnect service.");
  }

  if (!upstream.ok) {
    return NextResponse.json(payload, { status: upstream.status, headers: { "Cache-Control": "no-store", ...(requestId ? { "X-Request-Id": requestId } : {}) } });
  }

  const token = payload?.data?.token;
  if (!token) return gatewayError("Sign-in did not return a session. Please try again.");

  // The token is stored only in an HttpOnly cookie; it is stripped from the browser response.
  const res = NextResponse.json({ data: { user: payload.data?.user ?? null } }, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
