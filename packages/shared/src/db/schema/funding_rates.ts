import { relations, sql } from "drizzle-orm";
import { doublePrecision, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { tokensTable } from "./tokens";

export const fundingRatesTable = pgTable("funding_rates", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tokenAddress: varchar("token_address", { length: 255 })
    .notNull()
    .references(() => tokensTable.address),
  rate: doublePrecision("rate").notNull(), // Funding Rate値
  timestamp: timestamp("timestamp", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
});

export const fundingRateSelectSchema = createSelectSchema(fundingRatesTable);

export const fundingRatesRelations = relations(fundingRatesTable, ({ one }) => ({
  token: one(tokensTable, {
    fields: [fundingRatesTable.tokenAddress],
    references: [tokensTable.address],
  }),
}));

// DB操作のための型定義
export type FundingRateSelect = typeof fundingRatesTable.$inferSelect;
export type FundingRateInsert = typeof fundingRatesTable.$inferInsert;
