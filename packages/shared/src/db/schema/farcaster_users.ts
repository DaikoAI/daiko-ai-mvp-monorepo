import { boolean, integer, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const farcasterUsersTable = pgTable(
  "farcaster_users",
  {
    id: serial("id").primaryKey(),
    fid: integer("fid").notNull().unique(),
    username: text("username").notNull(),
    displayName: text("display_name"),
    avatar: text("avatar_url"),
    bio: text("bio"),
    followers: integer("followers_count").default(0),
    following: integer("following_count").default(0),
    lastFetchedAt: timestamp("last_fetched_at"),
    isMonitored: boolean("is_monitored").default(false),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("farcaster_users_fid_idx").on(table.fid),
    uniqueIndex("farcaster_users_username_idx").on(table.username),
  ],
);

export type FarcasterUsers = typeof farcasterUsersTable.$inferSelect;
export type NewFarcasterUsers = typeof farcasterUsersTable.$inferInsert;
