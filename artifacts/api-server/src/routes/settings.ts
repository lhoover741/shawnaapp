import { Router } from "express";
import { createHmac } from "crypto";
import { db, appSettingsTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";

const router = Router();

const DEFAULT_SETTINGS = {
  depositAmount: "25",
  hoursNote: "8:30 AM to 6:00 PM by appointment",
  closedDaysNote: "Closed Sunday and Monday",
  sameDayNote: "Same-day bookings only if approved",
  naturalHairColorsNote: "Braiding hair is included only in natural colors 1, 1B, 2, and 4 unless otherwise specified.",
  contactPhone: "7085743658",
};

type SettingKey = keyof typeof DEFAULT_SETTINGS;
const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS) as SettingKey[];

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

async function readSettings() {
  const rows = await db
    .select()
    .from(appSettingsTable)
    .where(inArray(appSettingsTable.key, SETTING_KEYS));
  const settings: Record<SettingKey, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    if (SETTING_KEYS.includes(row.key as SettingKey)) settings[row.key as SettingKey] = row.value;
  }
  return settings;
}

router.get("/settings", async (_req, res) => {
  try {
    res.json(await readSettings());
  } catch {
    res.json(DEFAULT_SETTINGS);
  }
});

router.get("/admin/settings", requireAdmin, async (_req, res) => {
  try {
    res.json(await readSettings());
  } catch {
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.patch("/admin/settings", requireAdmin, async (req: Request, res: Response) => {
  try {
    const body = req.body as Record<string, unknown>;
    const updates = SETTING_KEYS
      .filter((key) => typeof body[key] === "string")
      .map((key) => ({ key, value: String(body[key]).trim() || DEFAULT_SETTINGS[key], updatedAt: new Date() }));

    if (updates.length === 0) {
      res.status(400).json({ error: "No valid settings supplied" });
      return;
    }

    for (const item of updates) {
      await db
        .insert(appSettingsTable)
        .values(item)
        .onConflictDoUpdate({ target: appSettingsTable.key, set: { value: item.value, updatedAt: new Date() } });
    }

    res.json(await readSettings());
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
