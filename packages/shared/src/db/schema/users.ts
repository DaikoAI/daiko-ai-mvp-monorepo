import { relations, sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { accountsTable } from "./accounts";

export const usersTable = pgTable("users_table", {
  id: varchar("id")
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull(),
  emailVerified: timestamp("emailVerified", {
    mode: "date",
    withTimezone: true,
  }).default(sql`CURRENT_TIMESTAMP`),
  age: integer("age").notNull(),
  image: varchar("image", { length: 255 }),
  tradeStyle: text("tradeStyle").notNull(),
  totalAssetUsd: integer("totalAssetUsd").notNull(),
  cryptoInvestmentUsd: integer("cryptoInvestmentUsd").notNull(),
});

export const userSelectSchema = createSelectSchema(usersTable);

export const usersRelations = relations(usersTable, ({ many }) => ({
  accounts: many(accountsTable),
}));

// DB操作のための型定義
export type UserSelect = typeof usersTable.$inferSelect;
export type UserInsert = typeof usersTable.$inferInsert;
