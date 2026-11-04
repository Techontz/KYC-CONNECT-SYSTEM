import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/privacy-notice"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("bc_session")?.value);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (!hasSession && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (hasSession && pathname === "/login") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // App routes only: skip API handlers, Next internals, the manifest, the service worker and static files.
  matcher: ["/((?!api/|_next/|icons/|sw\\.js|manifest\\.webmanifest|favicon\\.ico|robots\\.txt|.*\\.(?:png|svg|ico|webp|jpg|txt)$).*)"],
};
