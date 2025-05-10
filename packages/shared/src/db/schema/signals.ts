import { pgTable, varchar, timestamp, integer, real, json, text, pgEnum } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

export const suggestionTypeEnum = pgEnum("suggestion_type_enum", [
  "buy",
  "sell",
  "close_position",
  "stake",
  "technical_analysis",
  "fundamentals",
  "news",
  "other",
]);

export const signalsTable = pgTable("signals", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  sources: json("sources").notNull(),
  sentimentScore: real("sentiment_score").notNull(),
  suggestionType: suggestionTypeEnum("suggestion_type").notNull(),
  strength: integer("strength").notNull(),
  confidence: real("confidence").notNull(),
  rationaleSummary: text("rationale_summary").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  metadata: json("metadata").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const signalSelectSchema = createSelectSchema(signalsTable);

export type SignalSelect = typeof signalsTable.$inferSelect;
export type SignalInsert = typeof signalsTable.$inferInsert;
