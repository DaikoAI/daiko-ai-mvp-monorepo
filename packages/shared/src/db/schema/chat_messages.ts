import { index, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { chatThreadsTable } from "./chat_threads";

// Define the sender enum type
export const senderEnum = pgEnum("sender", ["user", "ai", "system"]);

export const chatMessagesTable = pgTable(
  "chat_messages",
  {
    id: varchar("id")
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    threadId: varchar("thread_id")
      .notNull()
      .references(() => chatThreadsTable.id),
    sender: senderEnum("sender").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_chat_messages_thread").on(table.threadId)],
);
