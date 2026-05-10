const RAILWAY_API = "https://ravishing-push-server-production.up.railway.app";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function isAuthorized(context) {
  const authorization = context.request.headers.get("Authorization") || "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expectedToken = context.env.ADMIN_TOKEN || "admin-authenticated";
  return token && token === expectedToken;
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: jsonHeaders });
}

export async function onRequestPost(context) {
  try {
    if (!isAuthorized(context)) {
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
