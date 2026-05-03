export const VAPID_PUBLIC_KEY = "REPLACE_WITH_YOUR_PUBLIC_KEY";

export async function subscribeUser() {
  if (!('serviceWorker' in navigator)) return;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const reg = await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });

  await fetch("https://ravishing-push.YOUR-USERNAME.workers.dev/subscribe", {
    method: "POST",
    body: JSON.stringify(sub),
  });
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}
