import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

export const tokensTable = pgTable("tokens", {
  address: varchar("address", { length: 255 }).notNull().primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  decimals: integer("decimals").notNull(),
  type: varchar("type", { length: 20 }).notNull(), // "normal" | "lending" | "perp" | "staking"
  iconUrl: text("icon_url").notNull(),
});

export const tokenSelectSchema = createSelectSchema(tokensTable);

// DB操作のための型定義
export type TokenSelect = typeof tokensTable.$inferSelect;
export type TokenInsert = typeof tokensTable.$inferInsert;
