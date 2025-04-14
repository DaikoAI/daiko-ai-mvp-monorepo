import { index, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const chatThreadsTable = pgTable(
  "chat_threads",
  {
    id: varchar("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id),
    title: text("title").notNull().default("New Chat"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()), // Ensure updated_at is updated on modification
  },
  (table) => [index("idx_chat_threads_user").on(table.userId), index("idx_chat_threads_created").on(table.createdAt)],
);
