import { boolean, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const farcasterCastsTable = pgTable(
  "farcaster_casts",
  {
    id: serial("id").primaryKey(),
    hash: text("hash").notNull().unique(),
    authorFid: integer("author_fid").notNull(),
    text: text("text").notNull(),
    replyTo: text("reply_to"),
    timestamp: timestamp("timestamp").notNull(),
    fetchedAt: timestamp("fetched_at").notNull(),
    isLatest: boolean("is_latest").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("farcaster_casts_hash_idx").on(table.hash),
    uniqueIndex("farcaster_casts_author_fid_idx").on(table.authorFid),
  ],
);

export type FarcasterCasts = typeof farcasterCastsTable.$inferSelect;
export type NewFarcasterCasts = typeof farcasterCastsTable.$inferInsert;
