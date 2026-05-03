import { Router } from "express";
import { createHmac } from "crypto";
import { db } from "@workspace/db";
import { reviewsTable, pushTokensTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

const router = Router();

function getAdminToken(): string {
  const secret = process.env["SESSION_SECRET"] ?? "dev-secret";
  const password = process.env["ADMIN_PASSWORD"] ?? "admin";
  return createHmac("sha256", secret).update(password).digest("hex");
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers["authorization"];
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = auth.slice(7);
  if (token !== getAdminToken()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

router.post("/admin/login", (req: Request, res: Response) => {
  const { password } = req.body as { password?: string };
  if (!password) {
    res.status(400).json({ error: "Password required" });
    return;
  }
  if (!process.env["ADMIN_PASSWORD"]) {
    res.status(500).json({ error: "Admin not configured — set ADMIN_PASSWORD env var" });
    return;
  }
  if (password !== process.env["ADMIN_PASSWORD"]) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }
  const token = getAdminToken();
  res.json({ token });
});

router.get("/admin/verify", requireAdmin, (_req: Request, res: Response) => {
  res.json({ ok: true });
});

router.get("/admin/reviews", requireAdmin, async (req: Request, res: Response) => {
  try {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .orderBy(desc(reviewsTable.createdAt));
    res.json(reviews.map(r => ({
      id: r.id,
      clientName: r.clientName,
      rating: r.rating,
      body: r.body,
      service: r.service,
      createdAt: r.createdAt,
      featured: r.featured,
      approved: r.approved,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin reviews");
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.patch("/admin/reviews/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(Array.isArray(req.params["id"]) ? req.params["id"][0] ?? "0" : req.params["id"] ?? "0");
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const { approved, featured } = req.body as { approved?: boolean; featured?: boolean };
    const updates: Partial<{ approved: boolean; featured: boolean }> = {};
    if (typeof approved === "boolean") updates.approved = approved;
    if (typeof featured === "boolean") updates.featured = featured;
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Nothing to update" });
      return;
    }
    const updated = await db
      .update(reviewsTable)
      .set(updates)
      .where(eq(reviewsTable.id, id))
      .returning();
    if (!updated[0]) {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.json({
      id: updated[0].id,
      clientName: updated[0].clientName,
      rating: updated[0].rating,
      body: updated[0].body,
      service: updated[0].service,
      createdAt: updated[0].createdAt,
      featured: updated[0].featured,
      approved: updated[0].approved,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update review");
    res.status(500).json({ error: "Failed to update review" });
  }
});

router.delete("/admin/reviews/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(Array.isArray(req.params["id"]) ? req.params["id"][0] ?? "0" : req.params["id"] ?? "0");
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete review");
    res.status(500).json({ error: "Failed to delete review" });
  }
});

router.post("/admin/push/register-device", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { pushToken } = req.body as Record<string, unknown>;
    if (typeof pushToken !== "string" || !pushToken.trim()) {
      res.status(400).json({ error: "pushToken is required" }); return;
    }
    await db
      .insert(pushTokensTable)
      .values({ token: pushToken.trim(), isAdmin: true, updatedAt: new Date() })
      .onConflictDoUpdate({ target: pushTokensTable.token, set: { isAdmin: true, updatedAt: new Date() } });
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to register admin device");
    res.status(500).json({ error: "Failed to register admin device" });
  }
});

router.get("/admin/push/count", requireAdmin, async (req: Request, res: Response) => {
  try {
    const tokens = await db.select({ token: pushTokensTable.token }).from(pushTokensTable)
      .where(eq(pushTokensTable.isAdmin, false));
    res.json({ count: tokens.length });
  } catch (err) {
    req.log.error({ err }, "Failed to count push tokens");
    res.status(500).json({ error: "Failed to count tokens" });
  }
});

interface PushSendBody {
  title?: unknown;
  body?: unknown;
  data?: unknown;
}

interface ExpoMessage {
  to: string;
  sound: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

router.post("/admin/push", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { title, body, data } = req.body as PushSendBody;
    if (typeof title !== "string" || title.trim().length === 0) {
      res.status(400).json({ error: "title is required" });
      return;
    }
    if (typeof body !== "string" || body.trim().length === 0) {
      res.status(400).json({ error: "body is required" });
      return;
    }
    const tokens = await db.select({ token: pushTokensTable.token }).from(pushTokensTable)
      .where(eq(pushTokensTable.isAdmin, false));
    if (tokens.length === 0) {
      res.json({ sent: 0, failed: 0, message: "No registered devices" });
      return;
    }

    const CHUNK = 100;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < tokens.length; i += CHUNK) {
      const chunk = tokens.slice(i, i + CHUNK);
      const messages: ExpoMessage[] = chunk.map((t) => ({
        to: t.token,
        sound: "default",
        title: title.trim(),
        body: body.trim(),
        ...(data && typeof data === "object" ? { data: data as Record<string, unknown> } : {}),
      }));

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
        },
        body: JSON.stringify(messages),
      });

      if (response.ok) {
        const result = (await response.json()) as { data?: { status: string }[] };
        if (result.data) {
          for (const ticket of result.data) {
            if (ticket.status === "ok") sent++;
            else failed++;
          }
        } else {
          sent += chunk.length;
        }
      } else {
        failed += chunk.length;
        req.log.error({ status: response.status }, "Expo push API error");
      }
    }

    res.json({ sent, failed });
  } catch (err) {
    req.log.error({ err }, "Failed to send push notifications");
    res.status(500).json({ error: "Failed to send notifications" });
  }
});

export default router;
