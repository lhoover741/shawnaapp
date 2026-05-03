import { Router } from "express";
import { db } from "@workspace/db";
import { pushTokensTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function validateTokenInput(body: unknown): { token: string; deviceId?: string | null } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b["token"] !== "string" || !b["token"].startsWith("ExponentPushToken[")) return null;
  const deviceId = typeof b["deviceId"] === "string" ? b["deviceId"] : null;
  return { token: b["token"], deviceId };
}

router.post("/push-tokens", async (req, res) => {
  try {
    const validated = validateTokenInput(req.body);
    if (!validated) {
      res.status(400).json({ error: "Invalid push token" });
      return;
    }
    const { token, deviceId } = validated;
    await db
      .insert(pushTokensTable)
      .values({ token, deviceId, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: pushTokensTable.token,
        set: { updatedAt: new Date(), deviceId },
      });
    res.status(201).json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to register push token");
    res.status(500).json({ error: "Failed to register token" });
  }
});

router.delete("/push-tokens/:token", async (req, res) => {
  try {
    const token = decodeURIComponent(req.params["token"] ?? "");
    if (!token) {
      res.status(400).json({ error: "Token required" });
      return;
    }
    await db.delete(pushTokensTable).where(eq(pushTokensTable.token, token));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete push token");
    res.status(500).json({ error: "Failed to delete token" });
  }
});

export default router;
