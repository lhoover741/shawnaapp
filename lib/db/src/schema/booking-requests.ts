import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const bookingRequestsTable = pgTable("booking_requests", {
  id: serial("id").primaryKey(),
  clientName: text("client_name").notNull(),
  phone: text("phone").notNull(),
  service: text("service").notNull(),
  preferredDate: text("preferred_date"),
  flexibleDate: text("flexible_date").notNull().default("false"),
  timePreference: text("time_preference").notNull(),
  notes: text("notes"),
  hairColor: text("hair_color"),
  addons: text("addons"),
  basePrice: integer("base_price"),
  totalEstimate: integer("total_estimate"),
  status: text("status").notNull().default("pending"),
  clientPushToken: text("client_push_token"),
  clientWebPushSubscription: text("client_web_push_subscription"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BookingRequest = typeof bookingRequestsTable.$inferSelect;
