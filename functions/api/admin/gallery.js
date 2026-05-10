const RAILWAY_API = "https://ravishing-push-server-production.up.railway.app";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-File-Name"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestGet(context) {
  try {
    const authorization = context.request.headers.get("Authorization") || "";
    const response = await fetch(`${RAILWAY_API}/admin/gallery`, {
      headers: { Authorization: authorization },
    });
    const text = await response.text();
    return new Response(text, { status: response.status, headers: jsonHeaders });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to fetch admin gallery" }), { status: 500, headers: jsonHeaders });
  }
}

export async function onRequestPost(context) {
  try {
    const authorization = context.request.headers.get("Authorization") || "";
    const url = new URL(context.request.url);
    const contentType = context.request.headers.get("Content-Type") || "application/octet-stream";
    const fileName = context.request.headers.get("X-File-Name") || "gallery-image";
    const body = await context.request.arrayBuffer();
    const response = await fetch(`${RAILWAY_API}/admin/gallery${url.search}`, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": contentType,
        "X-File-Name": fileName,
      },
      body,
    });
    const text = await response.text();
    return new Response(text, { status: response.status, headers: jsonHeaders });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to upload gallery image" }), { status: 500, headers: jsonHeaders });
  }
}
