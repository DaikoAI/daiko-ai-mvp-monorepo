import { sql } from "drizzle-orm";
import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

export const usersTable = pgTable("users_table", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`), // ツイートの一意識別子
  name: text("name").notNull(),
  age: integer("age").notNull(),
  email: text("email").notNull().unique(),
  tradeStyle: text("tradeStyle").notNull(),
  totalAssetUsd: integer("totalAssetUsd").notNull(),
  cryptoInvestmentUsd: integer("cryptoInvestmentUsd").notNull(),
});

export const userSelectSchema = createSelectSchema(usersTable);

// DB操作のための型定義
export type UserSelect = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;
