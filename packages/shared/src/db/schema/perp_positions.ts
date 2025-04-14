import { relations, sql } from "drizzle-orm";
import { doublePrecision, index, integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { tokensTable } from "./tokens";
import { usersTable } from "./users";

export const perpPositionsTable = pgTable(
  "perp_positions",
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
    positionDirection: varchar("position_direction", { length: 10 }).notNull(), // "long" | "short"
    leverage: integer("leverage").notNull(), // レバレッジ倍率
    entryPrice: text("entry_price").notNull(), // エントリー時の価格
    positionSize: text("position_size").notNull(), // ポジションサイズ
    collateralAmount: text("collateral_amount").notNull(), // 証拠金として投入された量
    liquidationPrice: text("liquidation_price").notNull(), // 清算価格
    entryFundingRate: doublePrecision("entry_funding_rate").notNull(), // エントリー時のFunding Rate
    accumulatedFunding: text("accumulated_funding").notNull(), // 累積Funding調整額
    fundingRateLastApplied: timestamp("funding_rate_last_applied", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    status: varchar("status", { length: 20 }).notNull(), // "open" | "closed" | "liquidated"
    createdAt: timestamp("created_at", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      withTimezone: true,
    }).default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index("idx_perp_user_status").on(table.userId, table.status),
    index("idx_perp_token_address").on(table.tokenAddress),
    index("idx_perp_liquidation").on(table.liquidationPrice, table.status),
  ],
);

export const perpPositionSelectSchema = createSelectSchema(perpPositionsTable);

export const perpPositionsRelations = relations(perpPositionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [perpPositionsTable.userId],
    references: [usersTable.id],
  }),
  token: one(tokensTable, {
    fields: [perpPositionsTable.tokenAddress],
    references: [tokensTable.address],
  }),
}));

// DB操作のための型定義
export type PerpPositionSelect = typeof perpPositionsTable.$inferSelect;
export type PerpPositionInsert = typeof perpPositionsTable.$inferInsert;
