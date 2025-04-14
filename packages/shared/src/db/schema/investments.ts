import { relations, sql } from "drizzle-orm";
import { doublePrecision, index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { tokensTable } from "./tokens";
import { usersTable } from "./users";

export const investmentsTable = pgTable(
  "investments",
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
    actionType: varchar("action_type", { length: 50 }).notNull(), // "staking" | "liquid_staking" | "lending"
    principal: text("principal").notNull(), // 投資元本
    accruedInterest: text("accrued_interest").notNull(), // 累積利息
    startDate: timestamp("start_date", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    lastUpdate: timestamp("last_update", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    interestRate: doublePrecision("interest_rate").notNull(), // 利率
    status: varchar("status", { length: 20 }).notNull(), // "active" | "withdrawn"
  },
  (table) => [
    index("idx_investments_user_id").on(table.userId),
    index("idx_investments_token_address").on(table.tokenAddress),
    index("idx_investments_status").on(table.status),
    index("idx_investments_action_type").on(table.actionType),
  ],
);

export const investmentSelectSchema = createSelectSchema(investmentsTable);

export const investmentsRelations = relations(investmentsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [investmentsTable.userId],
    references: [usersTable.id],
  }),
  token: one(tokensTable, {
    fields: [investmentsTable.tokenAddress],
    references: [tokensTable.address],
  }),
}));

// DB操作のための型定義
export type InvestmentSelect = typeof investmentsTable.$inferSelect;
export type InvestmentInsert = typeof investmentsTable.$inferInsert;
