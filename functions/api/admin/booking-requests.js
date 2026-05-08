const RAILWAY_API = "https://ravishing-push-server-production.up.railway.app";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: jsonHeaders
  });
}

export async function onRequestGet(context) {
  try {
    const authorization = context.request.headers.get("Authorization") || "";
    const response = await fetch(`${RAILWAY_API}/admin/booking-requests`, {
      headers: {
        Authorization: authorization
      }
    });

    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: jsonHeaders
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch booking requests" }),
      {
        status: 500,
        headers: jsonHeaders
      }
    );
  }
}
