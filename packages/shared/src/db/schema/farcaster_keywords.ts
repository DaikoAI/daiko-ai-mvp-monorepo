import { boolean, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const farcasterKeywordsTable = pgTable("farcaster_keywords", {
  id: serial("id").primaryKey(),
  keyword: text("keyword").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  lastScannedAt: timestamp("last_scanned_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type FarcasterKeywords = typeof farcasterKeywordsTable.$inferSelect;
export type NewFarcasterKeywords = typeof farcasterKeywordsTable.$inferInsert;
