const RAILWAY_API = "https://ravishing-push-server-production.up.railway.app";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestGet(context) {
  try {
    const authorization = context.request.headers.get("Authorization") || "";
    const url = new URL(context.request.url);
    const response = await fetch(RAILWAY_API + "/api/admin/availability" + url.search, {
      method: "GET",
      headers: { Authorization: authorization }
    });
    const text = await response.text();
    return new Response(text, { status: response.status, headers: jsonHeaders });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to fetch admin availability" }), { status: 500, headers: jsonHeaders });
  }
}

async function proxyWrite(context, method) {
  try {
    const authorization = context.request.headers.get("Authorization") || "";
    const body = await context.request.text();
    const response = await fetch(RAILWAY_API + "/api/admin/availability", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization
      },
      body
    });
    const text = await response.text();
    return new Response(text, { status: response.status, headers: jsonHeaders });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to update admin availability" }), { status: 500, headers: jsonHeaders });
  }
}

export async function onRequestPatch(context) {
  return proxyWrite(context, "PATCH");
}

export async function onRequestPost(context) {
  return proxyWrite(context, "POST");
}
