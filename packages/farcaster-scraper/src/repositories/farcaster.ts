import { db } from "@daiko-ai/shared";
import {
  farcasterCastsTable,
  farcasterKeywordsTable,
  farcasterUsersTable,
  NewFarcasterCasts,
  NewFarcasterUsers,
} from "@daiko-ai/shared/src/db/schema";
import { eq, sql } from "drizzle-orm";

export class FarcasterRepository {
  constructor() {}

  async saveUser(user: NewFarcasterUsers) {
    return await db
      .insert(farcasterUsersTable)
      .values(user)
      .onConflictDoUpdate({
        target: farcasterUsersTable.fid,
        set: {
          username: user.username,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
          followers: user.followers,
          following: user.following,
          updatedAt: new Date(),
        },
      });
  }

  async saveCast(cast: NewFarcasterCasts) {
    return await db
      .insert(farcasterCastsTable)
      .values(cast)
      .onConflictDoUpdate({
        target: farcasterCastsTable.hash,
        set: {
          text: cast.text,
          replyTo: cast.replyTo,
          timestamp: cast.timestamp,
          fetchedAt: cast.fetchedAt,
          isLatest: cast.isLatest,
          updatedAt: new Date(),
        },
      });
  }

  async saveCasts(casts: Array<NewFarcasterCasts>) {
    if (casts.length === 0) return;
    return await db
      .insert(farcasterCastsTable)
      .values(casts)
      .onConflictDoUpdate({
        target: farcasterCastsTable.hash,
        set: {
          text: sql`EXCLUDED.text`,
          replyTo: sql`EXCLUDED.reply_to`,
          timestamp: sql`EXCLUDED.timestamp`,
          fetchedAt: sql`EXCLUDED.fetched_at`,
          isLatest: sql`EXCLUDED.is_latest`,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        },
      });
  }

  async updateKeywordLastScanned(keyword: string) {
    return await db
      .update(farcasterKeywordsTable)
      .set({ lastScannedAt: new Date() })
      .where(eq(farcasterKeywordsTable.keyword, keyword));
  }

  async getActiveKeywords() {
    return await db.select().from(farcasterKeywordsTable).where(eq(farcasterKeywordsTable.isActive, true));
  }

  async getMonitoredUsers() {
    return await db.select().from(farcasterUsersTable).where(eq(farcasterUsersTable.isMonitored, true));
  }
}
