import { NextResponse, type NextRequest } from "next/server";
import { apiBase, forwardHeaders, gatewayError } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Invalid request body." } }, { status: 400 });
  }
  const headers = forwardHeaders(req, { "Content-Type": "application/json" });
  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase()}/auth/otp/request`, { method: "POST", headers, body: JSON.stringify(body), cache: "no-store" });
  } catch {
    return gatewayError();
  }
  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/json",
      "Cache-Control": "no-store",
      ...(upstream.headers.get("x-request-id") ? { "X-Request-Id": upstream.headers.get("x-request-id")! } : {}),
      ...(upstream.headers.get("retry-after") ? { "Retry-After": upstream.headers.get("retry-after")! } : {}),
    },
  });
}
