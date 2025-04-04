import { decimal, index, jsonb, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { usersTable } from "./users";

export const portfolioSnapshots = pgTable(
  "portfolio_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => usersTable.id),
    timestamp: timestamp("timestamp").notNull(),
    totalValueUsd: decimal("total_value_usd", { precision: 20, scale: 8 }).notNull(),
    pnlFromPrevious: decimal("pnl_from_previous", { precision: 20, scale: 8 }),
    pnlFromStart: decimal("pnl_from_start", { precision: 20, scale: 8 }),
    snapshotDetails: jsonb("snapshot_details"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("user_timestamp_idx").on(table.userId, table.timestamp),
    index("timestamp_idx").on(table.timestamp),
  ],
);

// Zod スキーマ
export const insertPortfolioSnapshotSchema = createInsertSchema(portfolioSnapshots);
export const selectPortfolioSnapshotSchema = createSelectSchema(portfolioSnapshots);

// カラム名の型
export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
export type NewPortfolioSnapshot = typeof portfolioSnapshots.$inferInsert;
