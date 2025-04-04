import { relations, sql } from "drizzle-orm";
import { index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { tokensTable } from "./tokens";
import { usersTable } from "./users";

export const transactionsTable = pgTable(
  "transactions",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => usersTable.id),
    transactionType: varchar("transaction_type", { length: 50 }).notNull(), // "swap" | "staking" | "liquid_staking" | "perp_trade" | "perp_close" | "lending"
    fromTokenAddress: varchar("from_token_address", { length: 255 }).references(() => tokensTable.address),
    toTokenAddress: varchar("to_token_address", { length: 255 }).references(() => tokensTable.address),
    amountFrom: text("amount_from"),
    amountTo: text("amount_to"),
    fee: text("fee"),
    details: jsonb("details"), // 取引ルート、レート、その他動的パラメータ
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_transactions_user_id").on(table.userId),
    index("idx_transactions_created_at").on(table.createdAt),
    index("idx_transactions_type_user").on(table.transactionType, table.userId),
    index("idx_transactions_from_token").on(table.fromTokenAddress),
    index("idx_transactions_to_token").on(table.toTokenAddress),
  ],
);

export const transactionSelectSchema = createSelectSchema(transactionsTable);

export const transactionsRelations = relations(transactionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [transactionsTable.userId],
    references: [usersTable.id],
  }),
  fromToken: one(tokensTable, {
    fields: [transactionsTable.fromTokenAddress],
    references: [tokensTable.address],
  }),
  toToken: one(tokensTable, {
    fields: [transactionsTable.toTokenAddress],
    references: [tokensTable.address],
  }),
}));

// DB操作のための型定義
export type TransactionSelect = typeof transactionsTable.$inferSelect;
export type TransactionInsert = typeof transactionsTable.$inferInsert;
