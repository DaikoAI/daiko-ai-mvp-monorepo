import { relations, sql } from "drizzle-orm";
import { doublePrecision, index, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { tokensTable } from "./tokens";

export const fundingRatesTable = pgTable(
  "funding_rates",
  {
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
  },
  (table) => [
    index("idx_funding_rates_token").on(table.tokenAddress),
    index("idx_funding_rates_timestamp").on(table.timestamp),
  ],
);

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
