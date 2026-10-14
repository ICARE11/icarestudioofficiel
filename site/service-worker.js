const CACHE_NAME = "icare-studio-v11";
const APP_FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./supabase.js",
  "./i18n.js",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      if (request.mode === "navigate") return (await caches.match("./index.html"));
      throw new Error(`Offline resource unavailable: ${request.url}`);
    })
  );
});

self.addEventListener("push", (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (error) {
      console.error("Push payload was not valid JSON.", error);
      try {
        payload = { body: event.data.text() };
      } catch {
        payload = {};
      }
    }
  }
  const title = payload.title || "Icare Studio";
  const options = {
    body: payload.body || "Vous avez reçu une nouvelle notification.",
    icon: payload.icon || "./icon.svg",
    badge: payload.badge || "./icon.svg",
    tag: payload.tag || "icare-studio",
    renotify: Boolean(payload.renotify),
    data: { url: payload.url || "./" }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((item) => {
        try {
          return new URL(item.url).origin === self.location.origin;
        } catch {
          return false;
        }
      });
      if (existing) {
        existing.focus();
        if ("navigate" in existing && typeof existing.navigate === "function") {
          try {
            return existing.navigate(target);
          } catch {
            return undefined;
          }
        }
        return undefined;
      }
      return self.clients.openWindow(target);
    })
  );
});
