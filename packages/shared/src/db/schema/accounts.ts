import { relations } from "drizzle-orm";
import { index, integer, pgTable, primaryKey, text, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// AdapterAccountの代わりに直接型を定義する
type AccountType = "oauth" | "email" | "credentials" | "oidc";

export const accountsTable = pgTable(
  "accounts",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => usersTable.id),
    type: varchar("type", { length: 255 }).$type<AccountType>().notNull(),
    provider: varchar("provider", { length: 255 }).notNull(),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: varchar("token_type", { length: 255 }),
    scope: varchar("scope", { length: 255 }),
    id_token: text("id_token"),
    session_state: varchar("session_state", { length: 255 }),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] }), index("account_user_id_idx").on(t.userId)],
);

export const accountsRelations = relations(accountsTable, ({ one }) => ({
  user: one(usersTable, { fields: [accountsTable.userId], references: [usersTable.id] }),
}));

// DB操作のための型定義
export type AccountSelect = typeof accountsTable.$inferSelect;
export type AccountInsert = typeof accountsTable.$inferInsert;
