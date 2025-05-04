import { pgTable, varchar, timestamp, integer, json, real, text } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

export const signalsTable = pgTable("signals", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tokenAddress: varchar("token_address").notNull(),
  tokenSymbol: varchar("token_symbol").notNull(),
  type: varchar("type").notNull(),
  strength: integer("strength").notNull(),
  confidence: real("confidence").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  source: varchar("source").notNull(),
  description: text("description").notNull(),
  relatedTokens: json("related_tokens").notNull().default([]),
  relatedAccounts: json("related_accounts").notNull().default([]),
  triggerData: json("trigger_data").notNull(),
  projectedImpact: real("projected_impact"),
  expiresAt: timestamp("expires_at").notNull(),
  status: varchar("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const signalSelectSchema = createSelectSchema(signalsTable);

export type SignalSelect = typeof signalsTable.$inferSelect;
export type SignalInsert = typeof signalsTable.$inferInsert;
