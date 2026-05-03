import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  rating: integer("rating").notNull(),
  body: text("body").notNull(),
  service: text("service").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  featured: boolean("featured").default(false).notNull(),
  approved: boolean("approved").default(false).notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
