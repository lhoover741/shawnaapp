/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith("/api/"),
  new NetworkFirst({ cacheName: "api-cache", networkTimeoutSeconds: 10 })
);

function scopedUrl(path: string): string {
  return new URL(path.replace(/^\//, ""), self.registration.scope).href;
}

self.addEventListener("install", () => {
  console.log("[RB Push SW] install", { scope: self.registration.scope });
  void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[RB Push SW] activate", { scope: self.registration.scope });
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  console.log("[RB Push SW] push event received", { hasData: Boolean(event.data) });
  let payload: { title?: string; body?: string; url?: string; icon?: string; badge?: string } = {};

  if (event.data) {
    try {
      payload = event.data.json() as typeof payload;
    } catch {
      payload = { title: "Ravishing Beauté", body: event.data.text() };
    }
  }

  const title = payload.title || "Ravishing Beauté";
  const options: NotificationOptions = {
    body: payload.body || "You have a new Ravishing Beauté update.",
    icon: payload.icon || scopedUrl("logo-cropped.png"),
    badge: payload.badge || scopedUrl("logo-cropped.png"),
    data: { url: payload.url || self.registration.scope },
    tag: "ravishing-beaute-update",
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch((error) => {
      console.error("[RB Push SW] showNotification failed", error);
      throw error;
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  console.log("[RB Push SW] notification click", event.notification.data);
  event.notification.close();
  const rawUrl = (event.notification.data as { url?: string } | undefined)?.url || self.registration.scope;
  const targetUrl = new URL(rawUrl, self.registration.scope).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === targetUrl && "focus" in client) {
          return (client as WindowClient).focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
