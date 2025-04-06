import { relations, sql } from "drizzle-orm";
import { index, numeric, pgTable, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { tokensTable } from "./tokens";
import { usersTable } from "./users";

export const userBalancesTable = pgTable(
  "user_balances",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => usersTable.id),
    tokenAddress: varchar("token_address", { length: 255 })
      .notNull()
      .references(() => tokensTable.address),
    balance: numeric("balance", { precision: 100, scale: 2 }).notNull(), // 精度の高い数値型を文字列で保存
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("idx_user_balances_user_token").on(table.userId, table.tokenAddress),
    index("idx_user_balances_token_address").on(table.tokenAddress),
  ],
);

export const userBalanceSelectSchema = createSelectSchema(userBalancesTable);

export const userBalancesRelations = relations(userBalancesTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [userBalancesTable.userId],
    references: [usersTable.id],
  }),
  token: one(tokensTable, {
    fields: [userBalancesTable.tokenAddress],
    references: [tokensTable.address],
  }),
}));

// DB操作のための型定義
export type UserBalanceSelect = typeof userBalancesTable.$inferSelect;
export type UserBalanceInsert = typeof userBalancesTable.$inferInsert;
