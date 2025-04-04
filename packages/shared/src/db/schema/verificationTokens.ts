import { pgTable, primaryKey, timestamp, varchar } from "drizzle-orm/pg-core";

export const verificationTokensTable = pgTable(
  "verification_tokens",
  {
    identifier: varchar("identifier", { length: 255 }).notNull(),
    token: varchar("token", { length: 255 }).notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// DB操作のための型定義
export type VerificationTokenSelect = typeof verificationTokensTable.$inferSelect;
export type VerificationTokenInsert = typeof verificationTokensTable.$inferInsert;
