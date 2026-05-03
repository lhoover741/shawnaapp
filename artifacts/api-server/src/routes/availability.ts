import { Router } from "express";
import { db } from "@workspace/db";
import { availabilityTable } from "@workspace/db";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { createHmac } from "crypto";
import type { Request, Response, NextFunction } from "express";

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

function isValidDate(d: unknown): d is string {
  if (typeof d !== "string") return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(d);
}

function isValidStatus(s: unknown): s is "open" | "blocked" {
  return s === "open" || s === "blocked";
}

// Public: get all availability records for a year-month
router.get("/availability", async (req, res) => {
  try {
    const { year, month } = req.query as Record<string, string | undefined>;
    if (!year || !month) {
      res.status(400).json({ error: "year and month are required" });
      return;
    }
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) {
      res.status(400).json({ error: "Invalid year or month" });
      return;
    }
    const monthStr = String(m).padStart(2, "0");
    const start = `${y}-${monthStr}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${y}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

    const rows = await db
      .select()
      .from(availabilityTable)
      .where(and(gte(availabilityTable.date, start), lte(availabilityTable.date, end)));

    res.json(rows.map((r) => ({ date: r.date, status: r.status, note: r.note })));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch availability");
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

// Admin: upsert a date's status
router.post("/admin/availability", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { date, status, note } = req.body as Record<string, unknown>;
    if (!isValidDate(date)) { res.status(400).json({ error: "Invalid date (YYYY-MM-DD)" }); return; }
    if (!isValidStatus(status)) { res.status(400).json({ error: "status must be 'open' or 'blocked'" }); return; }
    const noteVal = typeof note === "string" ? note.trim() || null : null;

    const [row] = await db
      .insert(availabilityTable)
      .values({ date, status, note: noteVal, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: availabilityTable.date,
        set: { status, note: noteVal, updatedAt: new Date() },
      })
      .returning();

    res.json({ date: row!.date, status: row!.status, note: row!.note });
  } catch (err) {
    req.log.error({ err }, "Failed to set availability");
    res.status(500).json({ error: "Failed to set availability" });
  }
});

// Admin: clear a date (back to unmarked)
router.delete("/admin/availability/:date", requireAdmin, async (req: Request, res: Response) => {
  try {
    const date = req.params["date"] ?? "";
    if (!isValidDate(date)) { res.status(400).json({ error: "Invalid date" }); return; }
    await db.delete(availabilityTable).where(eq(availabilityTable.date, date));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Failed to clear availability");
    res.status(500).json({ error: "Failed to clear availability" });
  }
});

// Admin: get all availability (bulk, for calendar view including past)
router.get("/admin/availability", requireAdmin, async (req: Request, res: Response) => {
  try {
    const { year, month } = req.query as Record<string, string | undefined>;
    if (!year || !month) { res.status(400).json({ error: "year and month required" }); return; }
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) { res.status(400).json({ error: "Invalid params" }); return; }
    const monthStr = String(m).padStart(2, "0");
    const start = `${y}-${monthStr}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${y}-${monthStr}-${String(lastDay).padStart(2, "0")}`;
    const rows = await db
      .select()
      .from(availabilityTable)
      .where(and(gte(availabilityTable.date, start), lte(availabilityTable.date, end)));
    res.json(rows.map((r) => ({ date: r.date, status: r.status, note: r.note })));
  } catch (err) {
    req.log.error({ err }, "Failed to fetch admin availability");
    res.status(500).json({ error: "Failed to fetch availability" });
  }
});

export default router;
