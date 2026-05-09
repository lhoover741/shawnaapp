import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const notificationLogsTable = pgTable("notification_logs", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  url: text("url").notNull(),
  audience: text("audience").notNull(),
  sentCount: integer("sent_count").notNull().default(0),
  failedCount: integer("failed_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type NotificationLog = typeof notificationLogsTable.$inferSelect;
