import { Router } from "express";
import { db } from "@workspace/db";
import { reviewsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
function validateReviewInput(body: unknown): { clientName: string; rating: number; body: string; service: string } | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b["clientName"] !== "string" || b["clientName"].trim().length < 1 || b["clientName"].length > 100) return null;
  if (typeof b["rating"] !== "number" || !Number.isInteger(b["rating"]) || b["rating"] < 1 || b["rating"] > 5) return null;
  if (typeof b["body"] !== "string" || b["body"].trim().length < 10 || b["body"].length > 2000) return null;
  if (typeof b["service"] !== "string" || b["service"].trim().length < 1 || b["service"].length > 100) return null;
  return { clientName: b["clientName"].trim(), rating: b["rating"], body: b["body"].trim(), service: b["service"].trim() };
}

const router = Router();

router.get("/reviews", async (req, res) => {
  try {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.approved, true))
      .orderBy(reviewsTable.createdAt);
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
    req.log.error({ err }, "Failed to fetch reviews");
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

router.get("/reviews/featured", async (req, res) => {
  try {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(and(eq(reviewsTable.approved, true), eq(reviewsTable.featured, true)))
      .orderBy(reviewsTable.createdAt);
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
    req.log.error({ err }, "Failed to fetch featured reviews");
    res.status(500).json({ error: "Failed to fetch featured reviews" });
  }
});

router.post("/reviews", async (req, res) => {
  try {
    const validated = validateReviewInput(req.body);
    if (!validated) {
      res.status(400).json({ error: "Invalid input" });
      return;
    }
    const { clientName, rating, body, service } = validated;
    const [created] = await db
      .insert(reviewsTable)
      .values({ clientName, rating, body, service, approved: false, featured: false })
      .returning();
    res.status(201).json({
      id: created!.id,
      clientName: created!.clientName,
      rating: created!.rating,
      body: created!.body,
      service: created!.service,
      createdAt: created!.createdAt,
      featured: created!.featured,
      approved: created!.approved,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to submit review");
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export default router;
