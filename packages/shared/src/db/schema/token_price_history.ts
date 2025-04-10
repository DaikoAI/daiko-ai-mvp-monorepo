import { pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { tokensTable } from "./tokens";

export const tokenPriceHistory = pgTable("token_price_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  token_address: varchar("token_address", { length: 255 })
    .notNull()
    .references(() => tokensTable.address),
  price_usd: varchar("price_usd", { length: 78 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  source: varchar("source", { length: 50 }).notNull(),
});

// Schema for inserting a token price history
export const insertTokenPriceHistorySchema = createInsertSchema(tokenPriceHistory);

// Schema for selecting a token price history
export const selectTokenPriceHistorySchema = createSelectSchema(tokenPriceHistory);

// Types
export type TokenPriceHistory = typeof tokenPriceHistory.$inferSelect;
export type InsertTokenPriceHistory = typeof tokenPriceHistory.$inferInsert;
