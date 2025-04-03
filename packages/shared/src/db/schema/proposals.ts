import { sql } from "drizzle-orm";
import { json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
// Proposalテーブル定義
export const proposalTable = pgTable("proposals", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  triggerEventId: varchar("trigger_event_id"),
  userId: varchar("user_id"),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  reason: json("reason").notNull().$type<string[]>(),
  sources: json("sources").notNull().$type<{ name: string; url: string }[]>(),
  type: varchar("type"),
  proposedBy: varchar("proposed_by"),
  financialImpact: json("financial_impact").$type<{
    currentValue: number;
    projectedValue: number;
    percentChange: number;
    timeFrame: string;
    riskLevel: "low" | "medium" | "high";
  }>(),
  expires_at: timestamp("expires_at").notNull(),
  status: varchar("status").default("active"),
  contractCall: json("contract_call"),
  createdAt: timestamp("created_at")
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`NOW()`)
    .notNull(),
});

export const proposalSelectSchema = createSelectSchema(proposalTable);

// DB操作のための型定義
export type ProposalSelect = typeof proposalTable.$inferSelect;
export type ProposalInsert = typeof proposalTable.$inferInsert;
