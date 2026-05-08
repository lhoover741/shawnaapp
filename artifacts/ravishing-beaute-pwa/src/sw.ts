/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

declare const self: ServiceWorkerGlobalScope;

const PUSH_SERVER_URL = "https://ravishing-push-server-production.up.railway.app";

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ url }) => url.origin === self.location.origin && url.pathname.startsWith("/api/"),
  new NetworkFirst({ cacheName: "api-cache", networkTimeoutSeconds: 10 })
);

function scopedUrl(path: string): string {
  return new URL(path.replace(/^\//, ""), self.registration.scope).href;
}

function formatBookingDate(date?: string | null, flexibleDate?: boolean): string {
  if (flexibleDate) return "Flexible date";
  if (!date) return "Date not selected";

  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

async function sendBookingPushNotification(booking: Record<string, unknown>) {
  const clientName =
    typeof booking.clientName === "string" && booking.clientName.trim()
      ? booking.clientName.trim()
      : "New client";

  const service =
    typeof booking.service === "string" && booking.service.trim()
      ? booking.service.trim()
      : "Booking request";

  const dateLabel = formatBookingDate(
    typeof booking.preferredDate === "string" ? booking.preferredDate : null,
    Boolean(booking.flexibleDate),
  );

  const timePreference =
    typeof booking.timePreference === "string" && booking.timePreference.trim()
      ? booking.timePreference.trim()
      : "Flexible time";

  const body = `${service} • ${dateLabel} • ${timePreference}`;

  const response = await fetch(`${PUSH_SERVER_URL}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `New booking request from ${clientName}`,
      body,
      url: "/admin",
    }),
  });

  const result = await response.json().catch(() => ({}));
  console.log("[RB Push SW] booking push result", result);

  if (!response.ok) {
    throw new Error(`Booking push failed with ${response.status}`);
  }
}

async function handleBookingRequest(request: Request): Promise<Response> {
  const requestClone = request.clone();
  const response = await fetch(request);
  const responseClone = response.clone();

  if (response.ok) {
    try {
      const booking = (await requestClone.json()) as Record<string, unknown>;
      await sendBookingPushNotification(booking);
    } catch (error) {
      console.error("[RB Push SW] booking notification failed", error);
    }
  }

  return responseClone;
}

self.addEventListener("install", () => {
  console.log("[RB Push SW] install", { scope: self.registration.scope });
  void self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[RB Push SW] activate", { scope: self.registration.scope });
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isBookingRequest =
    event.request.method === "POST" &&
    url.origin === self.location.origin &&
    url.pathname === "/api/booking-requests";

  if (isBookingRequest) {
    console.log("[RB Push SW] booking request detected");
    event.respondWith(handleBookingRequest(event.request));
  }
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
