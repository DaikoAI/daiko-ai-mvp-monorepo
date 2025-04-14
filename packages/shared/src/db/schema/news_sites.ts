import { sql } from "drizzle-orm";
import { json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
// ニュースサイトテーブル定義
export const newsSiteTable = pgTable("news_sites", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  url: text("url").notNull(),
  title: text("title"),
  content: text("content"),
  userIds: json("user_ids")
    .$type<string[]>()
    .default(sql`'[]'`),
  lastScraped: timestamp("last_scraped"),
  createdAt: timestamp("created_at")
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`NOW()`)
    .notNull(),
});

export const newsSiteSelectSchema = createSelectSchema(newsSiteTable);

// DB操作のための型定義
export type NewsSiteSelect = typeof newsSiteTable.$inferSelect;
export type NewsSiteInsert = typeof newsSiteTable.$inferInsert;
