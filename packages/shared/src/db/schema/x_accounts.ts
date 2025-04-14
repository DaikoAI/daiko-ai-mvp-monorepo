import { sql } from "drizzle-orm";
import { json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

// XAccountsテーブル定義 - プロジェクト全体で使用する一元管理されたスキーマ
export const xAccountTable = pgTable("x_accounts", {
  id: varchar("id").primaryKey().notNull(),
  displayName: text("display_name"),
  profileImageUrl: text("profile_image_url"),
  lastTweetId: varchar("last_tweet_id"), // 最新ツイートIDへの参照
  userIds: json("user_ids").$type<string[]>(),
  createdAt: timestamp("created_at")
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`NOW()`)
    .notNull(),
});

export const xAccountSelectSchema = createSelectSchema(xAccountTable);

// DB操作のための型定義
export type XAccountSelect = typeof xAccountTable.$inferSelect;
export type XAccountInsert = typeof xAccountTable.$inferInsert;
