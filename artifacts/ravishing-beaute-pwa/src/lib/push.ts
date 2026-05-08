const DEFAULT_PUSH_SERVER_URL = "https://ravishing-push-server-production.up.railway.app";
const configuredPushServerUrl = typeof import.meta.env.VITE_PUSH_SERVER_URL === "string" ? import.meta.env.VITE_PUSH_SERVER_URL : DEFAULT_PUSH_SERVER_URL;
const PUSH_SERVER_URL = configuredPushServerUrl.replace(/\/$/, "");
const SW_URL = `${import.meta.env.BASE_URL}sw.js`.replace(/\/\//g, "/");

export type PushFlowStatus = "success" | "unsupported" | "denied" | "error";

export type PushServerJson = Record<string, unknown>;

export type PushFlowResult = {
  status: PushFlowStatus;
  message: string;
  permission?: NotificationPermission | "unsupported";
  registration?: {
    scope: string;
    active: boolean;
    installing: boolean;
    waiting: boolean;
  };
  subscription?: PushSubscriptionJSON;
  subscribeResponse?: PushServerJson;
  error?: string;
};

export type PushDebugSnapshot = {
  standalone: boolean;
  secureContext: boolean;
  notificationPermission: NotificationPermission | "unsupported";
  serviceWorkerSupported: boolean;
  pushManagerSupported: boolean;
  serviceWorkerRegistration?: PushFlowResult["registration"];
  subscription?: PushSubscriptionJSON | null;
  pushServerUrl: string;
  vapidPublicKey?: string | null;
  subscribeResponse?: PushServerJson;
  storedSubscriptionCount?: number | null;
  lastSendResult?: PushServerJson;
  lastError?: string;
};

function logPush(message: string, details?: unknown) {
  if (details === undefined) {
    console.log(`[RB Push] ${message}`);
  } else {
    console.log(`[RB Push] ${message}`, details);
  }
}

function registrationSummary(registration: ServiceWorkerRegistration): PushFlowResult["registration"] {
  return {
    scope: registration.scope,
    active: Boolean(registration.active),
    installing: Boolean(registration.installing),
    waiting: Boolean(registration.waiting),
  };
}

async function fetchJsonWithLogging(url: string, init?: RequestInit): Promise<PushServerJson> {
  logPush(`${init?.method ?? "GET"} ${url}`);
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const text = await res.text();
  let data: PushServerJson = {};
  if (text) {
    try {
      data = JSON.parse(text) as PushServerJson;
    } catch {
      data = { text };
    }
  }
  logPush(`Response ${res.status} from ${url}`, data);
  if (!res.ok) {
    throw new Error(`Push server returned ${res.status}: ${JSON.stringify(data)}`);
  }
  return data;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service workers are not supported in this browser.");
  }

  logPush("Registering service worker", { url: SW_URL, scope: import.meta.env.BASE_URL });
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: import.meta.env.BASE_URL });
  logPush("Service worker registered", registrationSummary(registration));

  await navigator.serviceWorker.ready;
  logPush("Service worker ready", registrationSummary(registration));
  return registration;
}

export async function getVapidPublicKey(): Promise<string> {
  const candidatePaths = ["/vapid-public-key", "/vapidPublicKey", "/api/web-push/vapid-public-key"];
  let lastError: unknown;

  for (const path of candidatePaths) {
    const url = `${PUSH_SERVER_URL}${path}`;
    try {
      const data = await fetchJsonWithLogging(url);
      const publicKey = typeof data.publicKey === "string"
        ? data.publicKey
        : typeof data.vapidPublicKey === "string"
          ? data.vapidPublicKey
          : typeof data.key === "string"
            ? data.key
            : null;
      if (publicKey) {
        logPush("Fetched VAPID public key", { length: publicKey.length, path });
        return publicKey;
      }
      lastError = new Error(`No publicKey field in response from ${path}`);
    } catch (error) {
      lastError = error;
      logPush(`VAPID key fetch failed for ${path}`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unable to fetch VAPID public key.");
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function subscribeToPush(): Promise<PushSubscription> {
  if (!("PushManager" in window)) {
    throw new Error("PushManager is not supported. On iPhone, install the site to the Home Screen and open it as the app.");
  }

  const registration = await registerServiceWorker();
  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    logPush("Using existing browser push subscription", existing.toJSON());
    return existing;
  }

  const publicKey = await getVapidPublicKey();
  const applicationServerKey = urlBase64ToUint8Array(publicKey);
  logPush("Creating browser push subscription");
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey.buffer.slice(applicationServerKey.byteOffset, applicationServerKey.byteOffset + applicationServerKey.byteLength) as ArrayBuffer,
  });
  logPush("Browser push subscription created", subscription.toJSON());
  return subscription;
}

export async function saveSubscription(subscription: PushSubscription): Promise<PushServerJson> {
  const body = JSON.stringify(subscription.toJSON());
  return fetchJsonWithLogging(`${PUSH_SERVER_URL}/subscribe`, { method: "POST", body });
}

export async function requestAndSubscribe(): Promise<PushFlowResult> {
  try {
    if (!("Notification" in window)) {
      return { status: "unsupported", message: "Notifications are not supported in this browser.", permission: "unsupported" };
    }
    if (!window.isSecureContext) {
      return { status: "unsupported", message: "Notifications require HTTPS.", permission: Notification.permission };
    }
    if (Notification.permission === "denied") {
      return { status: "denied", message: "Notifications are blocked. Enable them in iOS Settings, then try again.", permission: "denied" };
    }

    logPush("Requesting notification permission", { current: Notification.permission });
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    logPush("Notification permission result", permission);
    if (permission !== "granted") {
      return { status: "denied", message: "Notifications were not enabled.", permission };
    }

    const subscription = await subscribeToPush();
    const subscribeResponse = await saveSubscription(subscription);
    const registration = await navigator.serviceWorker.ready;
    return {
      status: "success",
      message: "Notifications enabled and saved.",
      permission,
      registration: registrationSummary(registration),
      subscription: subscription.toJSON(),
      subscribeResponse,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[RB Push] Subscribe flow failed", error);
    return { status: "error", message, permission: "Notification" in window ? Notification.permission : "unsupported", error: message };
  }
}

export async function getStoredSubscriptionCount(): Promise<number | null> {
  const candidatePaths = ["/", "/subscriptions/count", "/count", "/debug/count"];
  for (const path of candidatePaths) {
    try {
      const data = await fetchJsonWithLogging(`${PUSH_SERVER_URL}${path}`);
      const value = data.count ?? data.subscriptions ?? data.stored ?? data.total;
      if (typeof value === "number") return value;
      if (typeof value === "string" && Number.isFinite(Number(value))) return Number(value);
    } catch (error) {
      logPush(`Stored count fetch failed for ${path}`, error);
    }
  }
  return null;
}

export async function sendDebugPush(): Promise<PushServerJson> {
  return fetchJsonWithLogging(`${PUSH_SERVER_URL}/send`, {
    method: "POST",
    body: JSON.stringify({
      title: "Ravishing Beauté test",
      body: "Your iPhone PWA push subscription is working.",
      url: "/",
    }),
  });
}

export async function getPushDebugSnapshot(): Promise<PushDebugSnapshot> {
  const snapshot: PushDebugSnapshot = {
    standalone: window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone)),
    secureContext: window.isSecureContext,
    notificationPermission: "Notification" in window ? Notification.permission : "unsupported",
    serviceWorkerSupported: "serviceWorker" in navigator,
    pushManagerSupported: "PushManager" in window,
    pushServerUrl: PUSH_SERVER_URL,
  };

  try {
    if (snapshot.serviceWorkerSupported) {
      const registration = await navigator.serviceWorker.getRegistration(import.meta.env.BASE_URL) ?? await registerServiceWorker();
      snapshot.serviceWorkerRegistration = registrationSummary(registration);
      snapshot.subscription = (await registration.pushManager.getSubscription())?.toJSON() ?? null;
    }
    snapshot.vapidPublicKey = await getVapidPublicKey().catch((error) => {
      snapshot.lastError = error instanceof Error ? error.message : String(error);
      return null;
    });
    snapshot.storedSubscriptionCount = await getStoredSubscriptionCount();
  } catch (error) {
    snapshot.lastError = error instanceof Error ? error.message : String(error);
  }

  logPush("Debug snapshot", snapshot);
  return snapshot;
}
