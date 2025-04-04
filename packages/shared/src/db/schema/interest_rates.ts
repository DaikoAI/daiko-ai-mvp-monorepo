import { relations, sql } from "drizzle-orm";
import { doublePrecision, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { tokensTable } from "./tokens";

export const interestRatesTable = pgTable("interest_rates", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tokenAddress: varchar("token_address", { length: 255 })
    .notNull()
    .references(() => tokensTable.address),
  actionType: varchar("action_type", { length: 50 }).notNull(), // "staking" | "liquid_staking" | "lending"
  interestRate: doublePrecision("interest_rate").notNull(), // 利率
  effectiveDate: timestamp("effective_date", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
});

export const interestRateSelectSchema = createSelectSchema(interestRatesTable);

export const interestRatesRelations = relations(interestRatesTable, ({ one }) => ({
  token: one(tokensTable, {
    fields: [interestRatesTable.tokenAddress],
    references: [tokensTable.address],
  }),
}));

// DB操作のための型定義
export type InterestRateSelect = typeof interestRatesTable.$inferSelect;
export type InterestRateInsert = typeof interestRatesTable.$inferInsert;
