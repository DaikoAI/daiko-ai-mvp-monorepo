import { relations } from "drizzle-orm";
import { integer, pgTable, serial } from "drizzle-orm/pg-core";
import { farcasterCastsTable } from "./farcaster_casts";
import { farcasterKeywordsTable } from "./farcaster_keywords";

export const castKeywordsTable = pgTable("cast_keywords", {
  id: serial("id").primaryKey(),
  castId: integer("cast_id")
    .references(() => farcasterCastsTable.id)
    .notNull(),
  keywordId: integer("keyword_id")
    .references(() => farcasterKeywordsTable.id)
    .notNull(),
});

export const castKeywordsRelations = relations(castKeywordsTable, ({ one }) => ({
  cast: one(farcasterCastsTable, {
    fields: [castKeywordsTable.castId],
    references: [farcasterCastsTable.id],
  }),
  keyword: one(farcasterKeywordsTable, {
    fields: [castKeywordsTable.keywordId],
    references: [farcasterKeywordsTable.id],
  }),
}));
