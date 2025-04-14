import { relations } from "drizzle-orm";
import { index, integer, pgTable, primaryKey, text, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const authenticatorsTable = pgTable(
  "authenticators",
  {
    credentialID: varchar("credential_id", { length: 255 }).notNull().unique(),
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
    credentialPublicKey: text("credential_public_key").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: varchar("credential_device_type", { length: 255 }).notNull(),
    credentialBackedUp: integer("credential_backed_up").notNull(),
    transports: varchar("transports", { length: 255 }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.credentialID] }),
    index("authenticator_user_id_idx").on(table.userId),
  ],
);

export const authenticatorsRelations = relations(authenticatorsTable, ({ one }) => ({
  user: one(usersTable, { fields: [authenticatorsTable.userId], references: [usersTable.id] }),
}));

// DB操作のための型定義
export type AuthenticatorSelect = typeof authenticatorsTable.$inferSelect;
export type AuthenticatorInsert = typeof authenticatorsTable.$inferInsert;
