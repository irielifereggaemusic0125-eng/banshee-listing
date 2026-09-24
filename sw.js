/* Banshee 出品文ジェネレーター - 最小Service Worker
   目的: オフラインでもUIだけは開けるようにする。API通信はキャッシュしない。 */
const CACHE = "banshee-listing-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;                       // API(POST)は素通し
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // Gemini等の外部は素通し

  if (req.mode === "navigate") {                          // 画面本体: network-first
    e.respondWith(
      fetch(req).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put("./index.html", copy));
        return r;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  e.respondWith(                                          // それ以外: cache-first
    caches.match(req).then((hit) => hit || fetch(req).then((r) => {
      const copy = r.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return r;
    }).catch(() => hit))
  );
});
