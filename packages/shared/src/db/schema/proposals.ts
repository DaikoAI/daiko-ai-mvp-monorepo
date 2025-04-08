import { sql } from "drizzle-orm";
import { json, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Simplified Contract Call schema
const contractCallSchema = z.object({
  type: z.string(),
  description: z.string(),
  params: z.object({
    fromToken: z.object({
      symbol: z.string(),
      address: z.string(),
    }),
    toToken: z.object({
      symbol: z.string(),
      address: z.string(),
    }),
    fromAmount: z.number(),
  }),
  metadata: z.record(z.unknown()).optional(),
});

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
    simulationResults?: {
      success: boolean;
      tokenBalances?: Record<string, string>;
      positions?: Record<string, unknown>;
    };
  }>(),
  expires_at: timestamp("expires_at").notNull(),
  status: varchar("status").default("active"),
  contractCall: json("contract_call").$type<z.infer<typeof contractCallSchema>>(),
  createdAt: timestamp("created_at")
    .default(sql`NOW()`)
    .notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`NOW()`)
    .notNull(),
});

export const proposalSelectSchema = createSelectSchema(proposalTable).extend({
  contractCall: contractCallSchema.optional(),
});

// DB操作のための型定義
export type ProposalSelect = typeof proposalTable.$inferSelect;
export type ProposalInsert = typeof proposalTable.$inferInsert;

// Contract Call型のエクスポート
export type ContractCall = z.infer<typeof contractCallSchema>;

// バリデーション関数
export const validateContractCall = (data: unknown): ContractCall => {
  return contractCallSchema.parse(data);
};
