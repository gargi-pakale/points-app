// Cache names are origin-wide on GitHub Pages. Only delete this app's prefix.
const CACHE_PREFIX = "whichcard-points-app-";
const CACHE = CACHE_PREFIX + "v2.0.0";
const LEGACY_CACHES = ["whichcard-v1.8.1"];
const ASSETS = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k =>
      (k.startsWith(CACHE_PREFIX) || LEGACY_CACHES.includes(k)) && k !== CACHE)
      .map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("message", e => {
  if(e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("fetch", e => {
  if(e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if(e.request.mode === "navigate"){
      try{
        const response = await fetch(e.request);
        if(response.ok) await cache.put(e.request, response.clone());
        return response;
      }catch(error){
        return (await cache.match(e.request)) || (await cache.match("./index.html")) || Response.error();
      }
    }
    const cached = await cache.match(e.request);
    if(cached) return cached;
    try{
      const response = await fetch(e.request);
      if(response.ok) await cache.put(e.request, response.clone());
      return response;
    }catch(error){
      return Response.error();
    }
  })());
});
