const RAILWAY_API = "https://ravishing-push-server-production.up.railway.app";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestPost(context) {
  try {
    const authorization = context.request.headers.get("Authorization") || "";
    const body = await context.request.text();

    const response = await fetch(`${RAILWAY_API}/admin/client-notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authorization
      },
      body
    });

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: jsonHeaders
    });
  } catch {
    return new Response(JSON.stringify({ error: "Failed to send client notification" }), {
      status: 500,
      headers: jsonHeaders
    });
  }
}
