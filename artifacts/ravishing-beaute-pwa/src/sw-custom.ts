/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({ cacheName: "api-cache", networkTimeoutSeconds: 10 })
);

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; url?: string } = {};
  try {
    payload = event.data.json() as typeof payload;
  } catch {
    payload = { title: "Ravishing Beauté", body: event.data.text() };
  }
  const title = payload.title ?? "Ravishing Beauté";
  const options = {
    body: payload.body ?? "",
    icon: "/ravishing-beaute-pwa/logo-cropped.png",
    badge: "/ravishing-beaute-pwa/logo-cropped.png",
    data: { url: payload.url ?? "/ravishing-beaute-pwa/" },
    vibrate: [200, 100, 200],
  } as NotificationOptions;
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string })?.url ?? "/ravishing-beaute-pwa/";
  event.waitUntil(
    (self.clients as Clients).matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          void (client as WindowClient).focus();
          return;
        }
      }
      if (self.clients.openWindow) void self.clients.openWindow(url);
    })
  );
});
