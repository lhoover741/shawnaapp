const RAILWAY_API = "https://ravishing-push-server-production.up.railway.app";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const response = await fetch(`${RAILWAY_API}/reviews${url.search}`, {
      method: "GET"
    });
    const text = await response.text();
    return new Response(text, { status: response.status, headers: jsonHeaders });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to fetch reviews" }), { status: 500, headers: jsonHeaders });
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.text();
    const response = await fetch(`${RAILWAY_API}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
    const text = await response.text();
    return new Response(text, { status: response.status, headers: jsonHeaders });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to submit review" }), { status: 500, headers: jsonHeaders });
  }
}
