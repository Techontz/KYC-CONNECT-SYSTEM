import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, apiBase, clearSession, forwardHeaders } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await fetch(`${apiBase()}/auth/logout`, {
        method: "POST",
        headers: forwardHeaders(req, { Authorization: `Bearer ${token}`, Accept: "application/json" }),
        cache: "no-store",
      });
    } catch {
      /* Clear the local session even if the API is unreachable. */
    }
  }
  const res = NextResponse.json({ data: { loggedOut: true } }, { headers: { "Cache-Control": "no-store" } });
  clearSession(res);
  return res;
}
