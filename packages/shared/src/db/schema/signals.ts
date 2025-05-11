import { jsonb, pgEnum, pgTable, real, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

export const sentimentTypeEnum = pgEnum("sentiment_type", ["positive", "negative", "neutral"]);
export const suggestionTypeEnum = pgEnum("suggestion_type", ["buy", "sell", "hold", "stake", "close_position"]);

export const signalsTable = pgTable("signals", {
  id: varchar("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tokenAddress: varchar("token_address", { length: 255 }).notNull(),
  detectedAt: timestamp("detected_at").notNull().defaultNow(),
  sources: jsonb("sources").notNull(),
  sentimentType: sentimentTypeEnum("sentiment_type").notNull(),
  suggestionType: suggestionTypeEnum("suggestion_type").notNull(),
  confidence: real("confidence").notNull(),
  rationaleSummary: text("rationale_summary").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const signalSelectSchema = createSelectSchema(signalsTable);

export type SignalSelect = typeof signalsTable.$inferSelect;
export type SignalInsert = typeof signalsTable.$inferInsert;
