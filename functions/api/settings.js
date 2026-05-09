const RAILWAY_API = "https://ravishing-push-server-production.up.railway.app";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

const fallback = {
  depositAmount: "25",
  hoursNote: "8:30 AM to 6:00 PM by appointment",
  closedDaysNote: "Closed Sunday and Monday",
  sameDayNote: "Same-day bookings only if approved",
  naturalHairColorsNote: "Braiding hair is included only in natural colors 1, 1B, 2, and 4 unless otherwise specified.",
  contactPhone: "7085743658"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestGet() {
  try {
    const response = await fetch(`${RAILWAY_API}/api/settings`, { method: "GET" });
    const text = await response.text();
    return new Response(text, { status: response.status, headers: jsonHeaders });
  } catch {
    return new Response(JSON.stringify(fallback), { status: 200, headers: jsonHeaders });
  }
}
