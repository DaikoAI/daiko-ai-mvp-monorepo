import { relations, sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { accountsTable } from "./accounts";
import { pushSubscriptionTable } from "./push_subscriptions";

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
    age: integer("age"),
    image: varchar("image", { length: 255 }),
    tradeStyle: text("trade_style"),
    totalAssetUsd: integer("total_asset_usd"),
    cryptoInvestmentUsd: integer("crypto_investment_usd"),
    walletAddress: varchar("wallet_address", { length: 255 })
      .default("1nc1nerator11111111111111111111111111111111")
      .notNull(),
    riskTolerance: varchar("risk_tolerance", { length: 20 }).default("medium"),
    notificationEnabled: boolean("notification_enabled").default(false),
  },
  (table) => [index("idx_users_email").on(table.email), index("idx_users_wallet_address").on(table.walletAddress)],
);

export const userSelectSchema = createSelectSchema(usersTable);

export const usersRelations = relations(usersTable, ({ many }) => ({
  accounts: many(accountsTable),
  pushSubscriptions: many(pushSubscriptionTable),
}));

// DB操作のための型定義
export type UserSelect = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;
