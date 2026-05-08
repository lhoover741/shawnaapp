const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: jsonHeaders
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const password = String(body.password || body.pin || "");
    const expectedPassword = context.env.ADMIN_PASSWORD || "0606";

    if (password !== expectedPassword) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid password"
        }),
        {
          status: 401,
          headers: jsonHeaders
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        token: "admin-authenticated"
      }),
      {
        status: 200,
        headers: jsonHeaders
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Connection error. Try again."
      }),
      {
        status: 500,
        headers: jsonHeaders
      }
    );
  }
}

export async function onRequestGet() {
  return new Response(
    JSON.stringify({
      success: false,
      error: "Method not allowed"
    }),
    {
      status: 405,
      headers: jsonHeaders
    }
  );
}
