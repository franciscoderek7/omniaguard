const CACHE_NAME = "omniguard-site-v1";
const APP_SHELL = ["./", "omni-guard.html", "index.html", "manifest.json", "icon-192.svg", "icon-512.svg"];

self.addEventListener("install", function (event) {
  event.waitUntil(caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(APP_SHELL); }));
});

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
  }));
});

self.addEventListener("fetch", function (event) {
  event.respondWith(caches.match(event.request).then(function (cached) { return cached || fetch(event.request); }));
});
