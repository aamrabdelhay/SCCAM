/* Service worker: installable PWA with offline access to files already opened.
   - app shell + static assets: cache-first
   - navigations: network-first with offline fallback
   - extracted page text (used by reading mode/search): network-first, cached
   - PDF streams: cached when fetched in full; range requests always go to network
*/
const VERSION = "sccam-v1";
const SHELL = ["/", "/offline", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];
const RUNTIME = "sccam-runtime-v1";
const DOCS = "sccam-docs-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(new Request(url, { cache: "reload" })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![VERSION, RUNTIME, DOCS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "skip-waiting") self.skipWaiting();
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Admin area is never cached.
  if (url.pathname.startsWith("/admin")) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const shell = await caches.match("/");
          if (shell) return shell;
          return (await caches.match("/offline")) || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        }),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/vendor/") || /\.(png|svg|woff2?|css|js|webmanifest)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(request, VERSION).catch(() => fetch(request)));
    return;
  }

  if (/^\/api\/files\/[^/]+\/text$/.test(url.pathname)) {
    event.respondWith(networkFirst(request, DOCS));
    return;
  }

  if (/^\/api\/files\/[^/]+\/stream$/.test(url.pathname)) {
    const isRange = request.headers.has("range");
    if (isRange) return; // pdf.js range requests need the real network stream
    event.respondWith(
      caches.open(DOCS).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
  }
});
