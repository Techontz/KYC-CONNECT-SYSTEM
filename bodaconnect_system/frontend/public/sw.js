/*
 * BodaConnect OS service worker: app shell only (PRD 8.1).
 * Caches static build assets, icons and fonts. NEVER caches /api/* responses, HTML documents,
 * or any personal data. Navigations always go to the network; when offline a tiny built-in
 * page explains that data is unavailable.
 */
const VERSION = "bc-shell-v1";
const PRECACHE = ["/manifest.webmanifest", "/icons/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(VERSION).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(?:woff2?|css|js|svg|png|ico)$/.test(url.pathname)
  );
}

const OFFLINE_HTML = `<!doctype html><html lang="sw"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BodaConnect OS – Offline</title>
<style>body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:grid;place-items:center;background:#F6F8F7;color:#0B0F0D}main{max-width:420px;padding:32px;text-align:center}h1{letter-spacing:-.02em}p{color:#5B6B63;line-height:1.5}button{min-height:44px;padding:0 24px;border:0;border-radius:999px;background:#39B54A;color:#fff;font-weight:600;font-size:15px}</style></head>
<body><main><h1>Hakuna mtandao</h1><p>BodaConnect OS haihifadhi taarifa za wanachama kwenye kifaa hiki kwa usalama. Unganisha mtandao ili kuendelea.</p><p lang="en"><strong>You are offline.</strong> For privacy, member data is never stored on this device. Reconnect to continue.</p><button onclick="location.reload()">Jaribu tena / Retry</button></main></body></html>`;

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Never touch API traffic or personal data.
  if (url.pathname.startsWith("/api/")) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok && res.type === "basic") {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
