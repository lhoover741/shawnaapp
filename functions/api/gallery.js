const RAILWAY_API = "https://ravishing-push-server-production.up.railway.app";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestGet() {
  try {
    const response = await fetch(`${RAILWAY_API}/gallery`, { method: "GET" });
    const text = await response.text();
    return new Response(text, { status: response.status, headers: jsonHeaders });
  } catch {
    return new Response(JSON.stringify([]), { status: 200, headers: jsonHeaders });
  }
}
