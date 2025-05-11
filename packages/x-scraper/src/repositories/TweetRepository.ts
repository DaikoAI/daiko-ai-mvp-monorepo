import { TweetInsert, TweetRepository, TweetSelect, db, tweetTable } from "@daiko-ai/shared";
import { eq, sql } from "drizzle-orm";

export class PostgresTweetRepository implements TweetRepository {
  async findAll(): Promise<TweetSelect[]> {
    return await db.select().from(tweetTable);
  }

  async findById(id: string): Promise<TweetSelect | null> {
    const [tweet] = await db.select().from(tweetTable).where(eq(tweetTable.id, id)).limit(1);
    return tweet || null;
  }

  async findWhere<K extends keyof TweetSelect>(
    field: K,
    operator: string,
    value: TweetSelect[K],
  ): Promise<TweetSelect[]> {
    // 簡易的な実装 - 実際には様々な演算子をサポートする必要がある
    if (operator === "=") {
      return await db
        .select()
        .from(tweetTable)
        .where(eq(tweetTable[field as keyof TweetSelect], value));
    }
    return [];
  }

  async create(data: TweetInsert): Promise<TweetSelect> {
    const [tweet] = await db.insert(tweetTable).values(data).returning();
    return tweet;
  }

  async update(id: string, data: Partial<TweetSelect>): Promise<void> {
    await db.update(tweetTable).set(data).where(eq(tweetTable.id, id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(tweetTable).where(eq(tweetTable.id, id));
  }

  async findByAccountId(accountId: string, limit?: number): Promise<TweetSelect[]> {
    let query = db
      .select()
      .from(tweetTable)
      .where(eq(tweetTable.authorId, accountId))
      .orderBy(sql`${tweetTable.tweetTime} DESC`)
      .limit(limit ?? 0);

    return await query;
  }

  async findLatestByAccountId(accountId: string): Promise<TweetSelect | null> {
    const [tweet] = await db
      .select()
      .from(tweetTable)
      .where(eq(tweetTable.authorId, accountId))
      .orderBy(sql`${tweetTable.tweetTime} DESC`)
      .limit(1);

    return tweet || null;
  }
}
