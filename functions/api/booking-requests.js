const PUSH_SERVER_URL = "https://ravishing-push-server-production.up.railway.app";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

const serviceLabels = {
  "small-knotless": "Small Knotless",
  "medium-knotless": "Medium Knotless",
  "large-knotless": "Large Knotless",
  "two-feed-ins": "2 Feed-Ins",
  "six-feed-ins": "6 Feed-Ins",
  "eight-feed-ins": "8 Feed-Ins",
  "ten-fourteen-feed-ins": "10–14 Feed-Ins",
  "fourteen-twenty-feed-ins": "14–20+ Feed-Ins",
  "fulani-braids": "Fulani Braids",
  "lemonade-braids": "Lemonade Braids",
  "braided-ponytail": "Braided Ponytail",
  "middle-part-quick-weave": "Middle Part Quick Weave",
  "side-part-quick-weave": "Side Part Quick Weave",
  "free-part-quick-weave": "Free Part Quick Weave",
  "half-up-half-down": "Half Up Half Down",
  "half-freestyle-half-quick-weave": "Half Freestyle Half Quick Weave",
  "standard-sew-in": "Standard Sew-In",
  "half-up-half-down-sew-in": "Half Up Half Down Sew-In",
  "sleek-ponytail": "Sleek Ponytail",
  "natural-styles": "Natural Styles"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders
  });
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value) {
  const raw = cleanString(value);
  const digits = raw.replace(/\D/g, "");

  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  return raw;
}

function formatDate(value, flexibleDate) {
  if (flexibleDate === true || flexibleDate === "true") return "Flexible date";
  const date = cleanString(value);
  if (!date) return "Date not selected";

  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric"
    });
  } catch {
    return date;
  }
}

async function sendRailwayPush(payload) {
  try {
    const response = await fetch(`${PUSH_SERVER_URL}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));
    return {
      ok: response.ok,
      status: response.status,
      result
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
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
    message: "Use POST to submit a booking request."
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));

    const clientName = cleanString(body.clientName);
    const phone = normalizePhone(body.phone);
    const service = cleanString(body.service);
    const serviceLabel = serviceLabels[service] || service || "Service not selected";
    const preferredDate = cleanString(body.preferredDate);
    const flexibleDate = body.flexibleDate === true || body.flexibleDate === "true";
    const timePreference = cleanString(body.timePreference) || "flexible";
    const notes = cleanString(body.notes);
    const addons = cleanString(body.addons);
    const totalEstimate = typeof body.totalEstimate === "number" ? body.totalEstimate : null;

    if (!clientName) {
      return json({ ok: false, error: "Please enter your name." }, 400);
    }

    if (!phone) {
      return json({ ok: false, error: "Please enter your phone number." }, 400);
    }

    if (!service) {
      return json({ ok: false, error: "Please select a service." }, 400);
    }

    const id = Date.now();
    const dateLabel = formatDate(preferredDate, flexibleDate);
    const estimateLabel = totalEstimate ? ` • $${totalEstimate}+` : "";
    const notificationBody = `${serviceLabel} • ${dateLabel} • ${timePreference}${estimateLabel}`;

    const push = await sendRailwayPush({
      title: `New booking request from ${clientName}`,
      body: notificationBody,
      url: "/admin"
    });

    return json(
      {
        ok: true,
        id,
        status: "pending",
        message: "Booking request submitted.",
        booking: {
          id,
          clientName,
          phone,
          service,
          serviceLabel,
          preferredDate: preferredDate || null,
          flexibleDate,
          timePreference,
          notes: notes || null,
          addons: addons || null,
          totalEstimate
        },
        push
      },
      201
    );
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
