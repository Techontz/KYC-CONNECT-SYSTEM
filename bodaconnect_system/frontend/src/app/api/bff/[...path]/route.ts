import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, apiBase, clearSession, forwardHeaders, gatewayError } from "@/lib/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PASS_RESPONSE_HEADERS = ["content-type", "content-disposition", "content-length", "x-request-id", "retry-after", "etag", "last-modified", "idempotent-replayed"];

type Ctx = { params: Promise<{ path: string[] }> };

async function proxy(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  if (!path?.length || path.some((seg) => seg === ".." || seg === "." || seg.includes("\\"))) {
    return NextResponse.json({ error: { code: "NOT_FOUND", message: "Not found." } }, { status: 404 });
  }
  const target = `${apiBase()}/${path.map(encodeURIComponent).join("/")}${req.nextUrl.search}`;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const headers = forwardHeaders(req, token ? { Authorization: `Bearer ${token}` } : {});

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // Required by Node fetch when streaming a request body (multipart uploads).
      ...(hasBody ? { duplex: "half" } : {}),
      redirect: "manual",
      cache: "no-store",
    } as RequestInit);
  } catch {
    return gatewayError();
  }

  const resHeaders = new Headers({ "Cache-Control": "no-store" });
  for (const name of PASS_RESPONSE_HEADERS) {
    const v = upstream.headers.get(name);
    if (v) resHeaders.set(name, v);
  }
  const res = new NextResponse(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers: resHeaders });
  if (upstream.status === 401 && token) clearSession(res);
  return res;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
