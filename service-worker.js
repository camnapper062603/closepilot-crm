const CACHE_NAME = "kira-home-shell-v4";
const APP_SHELL = [
  "/",
  "/index.html",
  "/app.js",
  "/styles.css",
  "/config.js",
  "/manifest.webmanifest",
  "/app-store.js",
  "/recruiting.html",
  "/recruiting.css",
  "/recruiting.js",
  "/SafeLeadGenerator-Standalone.html",
  "/assets/kira-app-icon.svg",
  "/assets/crm-workspace.png",
];
const OFFLINE_PAGES = new Map([
  ["/", "/index.html"],
  ["/recruiting", "/recruiting.html"],
  ["/recruiting.html", "/recruiting.html"],
  ["/recruiting/dashboard", "/recruiting.html"],
  ["/recruiting/job", "/recruiting.html"],
  ["/recruiting/boards", "/recruiting.html"],
  ["/recruiting/integrations", "/recruiting.html"],
  ["/recruiting/applicants", "/recruiting.html"],
  ["/recruiting/interviews", "/recruiting.html"],
  ["/recruiting/onboarding", "/recruiting.html"],
  ["/recruiting/payroll", "/recruiting.html"],
  ["/recruiting/crm", "/recruiting.html"],
  ["/lead-generator", "/SafeLeadGenerator-Standalone.html"],
  ["/SafeLeadGenerator-Standalone.html", "/SafeLeadGenerator-Standalone.html"],
]);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_PAGES.get(url.pathname) || "/index.html")));
    return;
  }

  if (["script", "style"].includes(request.destination) || url.pathname === "/config.js") {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    }),
  );
});
