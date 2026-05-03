import { Router } from "express";
import { db } from "@workspace/db";
import { bookingRequestsTable, pushTokensTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { createHmac } from "crypto";
import type { Request, Response, NextFunction } from "express";
import { webpush } from "./web-push";

const router = Router();

function getAdminToken(): string {
  const secret = process.env["SESSION_SECRET"] ?? "dev-secret";
  const password = process.env["ADMIN_PASSWORD"] ?? "admin";
  return createHmac("sha256", secret).update(password).digest("hex");
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (auth.slice(7) !== getAdminToken()) { res.status(401).json({ error: "Unauthorized" }); return; }
  next();
}

const SERVICES: Record<string, string> = {
  "knotless-sm": "Small Knotless Braids",
  "knotless-md": "Medium Knotless Braids",
  "knotless-lg": "Large Knotless Braids",
  "feedin": "Feed-In Braids",
  "stitch": "Stitch Braids",
  "bobbraids": "Bob Braids",
  "ponytail": "Braided Ponytail",
  "quickweave": "Quick Weave",
};

async function sendPushToClient(token: string, title: string, body: string, data?: Record<string, unknown>) {
  try {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify([{ to: token, title, body, data: data ?? {}, sound: "default" }]),
    });
  } catch {
    // fire-and-forget
  }
}

async function sendPushToAll(title: string, body: string, data?: Record<string, unknown>) {
  try {
    const tokens = await db.select().from(pushTokensTable).where(eq(pushTokensTable.isAdmin, true));
    if (!tokens.length) return;
    const messages = tokens.map((t) => ({
      to: t.token,
      title,
      body,
      data: data ?? {},
      sound: "default",
    }));
    const chunks: typeof messages[] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }
    await Promise.allSettled(
      chunks.map((chunk) =>
        fetch("https://exp.host/--/api/v2/push/send", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(chunk),
        })
      )
    );
  } catch {
    // fire-and-forget — don't fail the booking request
  }
}

// Admin: login — accepts password, returns Bearer token
router.post("/admin/login", (req: Request, res: Response) => {
  const { password } = req.body as Record<string, unknown>;
  const adminPassword = process.env["ADMIN_PASSWORD"] ?? "admin";
  if (typeof password !== "string" || password !== adminPassword) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }
  res.json({ token: getAdminToken() });
});

// Public: get a single booking status (for client notification center)
router.get("/booking-requests/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params["id"] ?? ""), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const [row] = await db.select().from(bookingRequestsTable).where(eq(bookingRequestsTable.id, id));
    if (!row) { res.status(404).json({ error: "Not found" }); return; }
    res.json({
      id: row.id,
      service: row.service,
      serviceLabel: SERVICES[row.service] ?? row.service,
      preferredDate: row.preferredDate,
      flexibleDate: row.flexibleDate,
      timePreference: row.timePreference,
      hairColor: row.hairColor,
      addons: row.addons,
      basePrice: row.basePrice,
      totalEstimate: row.totalEstimate,
      status: row.status,
      updatedAt: row.updatedAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch booking request");
    res.status(500).json({ error: "Failed to fetch booking" });
  }
});

// Public: submit a booking request
router.post("/booking-requests", async (req: Request, res: Response) => {
  try {
    const {
      clientName, phone, service, preferredDate, flexibleDate, timePreference,
      notes, clientPushToken, clientWebPushSubscription, hairColor, addons, basePrice, totalEstimate,
    } = req.body as Record<string, unknown>;

    if (typeof clientName !== "string" || !clientName.trim()) {
      res.status(400).json({ error: "clientName is required" }); return;
    }
    if (typeof phone !== "string" || !phone.trim()) {
      res.status(400).json({ error: "phone is required" }); return;
    }
    if (typeof service !== "string" || !SERVICES[service]) {
      res.status(400).json({ error: "Invalid service" }); return;
    }
    if (typeof timePreference !== "string" || !["morning", "afternoon", "flexible"].includes(timePreference)) {
      res.status(400).json({ error: "Invalid timePreference" }); return;
    }

    const [row] = await db
      .insert(bookingRequestsTable)
      .values({
        clientName: clientName.trim(),
        phone: phone.trim(),
        service,
        preferredDate: typeof preferredDate === "string" && preferredDate ? preferredDate : null,
        flexibleDate: flexibleDate === true || flexibleDate === "true" ? "true" : "false",
        timePreference,
        notes: typeof notes === "string" && notes.trim() ? notes.trim() : null,
        hairColor: typeof hairColor === "string" && hairColor.trim() ? hairColor.trim() : null,
        addons: typeof addons === "string" && addons.trim() ? addons.trim() : null,
        basePrice: typeof basePrice === "number" ? basePrice : null,
        totalEstimate: typeof totalEstimate === "number" ? totalEstimate : null,
        status: "pending",
        clientPushToken: typeof clientPushToken === "string" && clientPushToken.trim() ? clientPushToken.trim() : null,
        clientWebPushSubscription: typeof clientWebPushSubscription === "string" && clientWebPushSubscription.trim() ? clientWebPushSubscription.trim() : null,
      })
      .returning();

    const serviceLabel = SERVICES[service] ?? service;
    const dateLabel = row!.preferredDate
      ? new Date(row!.preferredDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      : "flexible";

    const estimateLabel = row!.totalEstimate ? ` · $${row!.totalEstimate}+` : "";
    sendPushToAll(
      "✂️ New Booking Request",
      `${clientName.trim()} · ${serviceLabel} · ${dateLabel}${estimateLabel}`,
      { path: "/admin" }
    );

    res.status(201).json({
      id: row!.id,
      clientName: row!.clientName,
      service: row!.service,
      serviceLabel,
      preferredDate: row!.preferredDate,
      timePreference: row!.timePreference,
      hairColor: row!.hairColor,
      addons: row!.addons,
      basePrice: row!.basePrice,
      totalEstimate: row!.totalEstimate,
      status: row!.status,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create booking request");
    res.status(500).json({ error: "Failed to submit booking request" });
  }
});

// Admin: list all booking requests
router.get("/admin/booking-requests", requireAdmin, async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select()
      .from(bookingRequestsTable)
      .orderBy(desc(bookingRequestsTable.createdAt));
    const withLabel = rows.map((r) => ({ ...r, serviceLabel: SERVICES[r.service] ?? r.service }));
    res.json(withLabel);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch booking requests");
    res.status(500).json({ error: "Failed to fetch booking requests" });
  }
});

// Admin: update status of a booking request
router.patch("/admin/booking-requests/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params["id"] ?? ""), 10);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
    const { status } = req.body as Record<string, unknown>;
    if (typeof status !== "string" || !["pending", "confirmed", "cancelled"].includes(status)) {
      res.status(400).json({ error: "Invalid status" }); return;
    }
    const [row] = await db
      .update(bookingRequestsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(bookingRequestsTable.id, id))
      .returning();
    if (!row) { res.status(404).json({ error: "Not found" }); return; }

    const serviceLabel = SERVICES[row.service] ?? row.service;
    const dateLabel = row.preferredDate
      ? new Date(row.preferredDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
      : "your flexible date";

    if (status === "confirmed" || status === "cancelled") {
      const title = status === "confirmed" ? "🎉 Appointment Confirmed!" : "Appointment Update";
      const body = status === "confirmed"
        ? `${serviceLabel} · ${dateLabel} — see you soon! 💅`
        : `Your ${serviceLabel} request was cancelled. Reach out to Shawna to reschedule.`;
      const url = "/ravishing-beaute-pwa/";

      if (row.clientPushToken) {
        sendPushToClient(row.clientPushToken, title, body, { path: "/" });
      }

      if (row.clientWebPushSubscription) {
        try {
          const sub = JSON.parse(row.clientWebPushSubscription) as webpush.PushSubscription;
          void webpush.sendNotification(sub, JSON.stringify({ title, body, url })).catch(() => {});
        } catch {
          // malformed subscription — ignore
        }
      }
    }

    res.json({ ...row, serviceLabel: SERVICES[row.service] ?? row.service });
  } catch (err) {
    req.log.error({ err }, "Failed to update booking request");
    res.status(500).json({ error: "Failed to update booking request" });
  }
});

export default router;
