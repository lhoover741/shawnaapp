import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const availabilityTable = pgTable("availability", {
  id: serial("id").primaryKey(),
  date: text("date").notNull().unique(),
  status: text("status").notNull(),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Availability = typeof availabilityTable.$inferSelect;
