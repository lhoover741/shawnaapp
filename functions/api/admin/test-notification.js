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
    if (!authorization.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders
      });
    }

    const verify = await fetch(`${RAILWAY_API}/api/admin/settings`, {
      method: "GET",
      headers: { Authorization: authorization }
    });

    if (!verify.ok) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: jsonHeaders
      });
    }

    const response = await fetch(`${RAILWAY_API}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Ravishing Beauté admin test",
        body: "Admin notifications are working.",
        url: "/admin",
        audience: "admin"
      })
    });

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: jsonHeaders
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to send admin test notification" }), {
      status: 500,
      headers: jsonHeaders
    });
  }
}
