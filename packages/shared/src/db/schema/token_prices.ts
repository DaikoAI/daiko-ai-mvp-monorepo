import { relations, sql } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { tokensTable } from "./tokens";

export const tokenPricesTable = pgTable(
  "token_prices",
  {
    id: varchar("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    tokenAddress: varchar("token_address", { length: 255 })
      .notNull()
      .references(() => tokensTable.address),
    priceUsd: text("price_usd").notNull(),
    lastUpdated: timestamp("last_updated", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    source: varchar("source", { length: 50 }).notNull(),
  },
  (table) => [
    uniqueIndex("idx_token_prices_address").on(table.tokenAddress),
    index("idx_token_prices_updated").on(table.lastUpdated),
  ],
);

export const tokenPriceSelectSchema = createSelectSchema(tokenPricesTable);

export const tokenPricesRelations = relations(tokenPricesTable, ({ one }) => ({
  token: one(tokensTable, {
    fields: [tokenPricesTable.tokenAddress],
    references: [tokensTable.address],
  }),
}));

// DB操作のための型定義
export type TokenPriceSelect = typeof tokenPricesTable.$inferSelect;
export type TokenPriceInsert = typeof tokenPricesTable.$inferInsert;
