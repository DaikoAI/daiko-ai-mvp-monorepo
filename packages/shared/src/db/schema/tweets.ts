import { sql } from "drizzle-orm";
import { json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { xAccountTable } from "./xAccounts";

// ツイートテーブル定義 - ツイートの履歴を保存する
export const tweetTable = pgTable("tweets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`), // ツイートの一意識別子
  xAccountId: varchar("x_account_id")
    .notNull()
    .references(() => xAccountTable.id), // アカウントへの参照
  content: text("content").notNull(), // ツイート本文
  tweetTime: timestamp("tweet_time").notNull(), // ツイート時間
  metadata: json("metadata"), // リンク、メディア、メンションなどの追加情報
  createdAt: timestamp("created_at")
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`NOW()`)
    .notNull(),
});

export const tweetSelectSchema = createSelectSchema(tweetTable);

// DB操作のための型定義
export type TweetSelect = typeof tweetTable.$inferSelect;
export type TweetInsert = typeof tweetTable.$inferInsert;
