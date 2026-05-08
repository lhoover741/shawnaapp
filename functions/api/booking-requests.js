const RAILWAY_API = "https://ravishing-push-server-production.up.railway.app";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders
  });
}

async function forwardToRailway(request) {
  const body = await request.text();

  const response = await fetch(`${RAILWAY_API}/booking-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body
  });

  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: jsonHeaders
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: jsonHeaders
  });
}

export async function onRequestGet() {
  return json({
    ok: true,
    service: "Ravishing Beauté booking request API",
    storage: "Railway PostgreSQL",
    railway: RAILWAY_API
  });
}

export async function onRequestPost(context) {
  try {
    return await forwardToRailway(context.request);
  } catch (error) {
    return json(
      {
        ok: false,
        error: "Booking request could not be submitted. Please try again."
      },
      500
    );
  }
}
