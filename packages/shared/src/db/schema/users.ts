import { relations, sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { accountsTable } from "./accounts";

export const usersTable = pgTable(
  "users",
  {
    id: varchar("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }),
    email: varchar("email", { length: 255 }).notNull(),
    emailVerified: timestamp("email_verified", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    age: integer("age").notNull(),
    image: varchar("image", { length: 255 }),
    tradeStyle: text("trade_style").notNull(),
    totalAssetUsd: integer("total_asset_usd").notNull(),
    cryptoInvestmentUsd: integer("crypto_investment_usd").notNull(),
    walletAddress: varchar("wallet_address", { length: 255 }).notNull(),
  },
  (table) => [index("idx_users_email").on(table.email), index("idx_users_wallet_address").on(table.walletAddress)],
);

export const userSelectSchema = createSelectSchema(usersTable);

export const usersRelations = relations(usersTable, ({ many }) => ({
  accounts: many(accountsTable),
}));

// DB操作のための型定義
export type UserSelect = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;
