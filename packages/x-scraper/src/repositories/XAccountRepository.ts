import { XAccountInsert, XAccountRepository, XAccountSelect, db, xAccountTable } from "@daiko-ai/shared";
import { eq, sql } from "drizzle-orm";
export class PostgresXAccountRepository implements XAccountRepository {
  async findAll(): Promise<XAccountSelect[]> {
    const accounts = await db.select().from(xAccountTable);
    return accounts;
  }

  async findById(id: string): Promise<XAccountSelect | null> {
    const [account] = await db.select().from(xAccountTable).where(eq(xAccountTable.id, id)).limit(1);
    if (!account) return null;
    return account;
  }

  async findWhere<K extends keyof XAccountSelect>(
    field: K,
    operator: string,
    value: XAccountSelect[K],
  ): Promise<XAccountSelect[]> {
    // 特定のユースケースのみ対応
    if (field === "userIds" && operator === "array-contains") {
      const accounts = await db
        .select()
        .from(xAccountTable)
        .where(sql`${xAccountTable.userIds} @> ${JSON.stringify([value])}::jsonb`);
      return accounts;
    }

    throw new Error(`Unsupported query operation: ${String(field)} ${operator} ${String(value)}`);
  }

  async create(data: XAccountInsert): Promise<XAccountSelect> {
    const [account] = await db
      .insert(xAccountTable)
      .values({
        id: data.id,
        displayName: data.displayName,
        profileImageUrl: data.profileImageUrl,
        lastTweetId: data.lastTweetId,
        userIds: (data.userIds as string[]) || [],
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date(),
      })
      .returning();

    return account;
  }

  async update(id: string, data: Partial<XAccountSelect>): Promise<void> {
    const updateData: any = { ...data };

    // updatedAtフィールドが指定されていなければ現在時刻を設定
    if (!updateData.updatedAt) {
      updateData.updatedAt = new Date();
    }

    await db.update(xAccountTable).set(updateData).where(eq(xAccountTable.id, id));
  }

  async delete(id: string): Promise<void> {
    await db.delete(xAccountTable).where(eq(xAccountTable.id, id));
  }

  async findByUserId(userId: string): Promise<XAccountSelect[]> {
    const accounts = await db
      .select()
      .from(xAccountTable)
      .where(sql`${xAccountTable.userIds} @> ${JSON.stringify([userId])}::jsonb`);

    return accounts;
  }

  async updateLastTweetId(accountId: string, tweetId: string): Promise<void> {
    await db
      .update(xAccountTable)
      .set({
        lastTweetId: tweetId,
        updatedAt: new Date(),
      })
      .where(eq(xAccountTable.id, accountId));
  }

  async addUser(accountId: string, userId: string): Promise<void> {
    const account = await this.findById(accountId);
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const userIds = account.userIds || [];
    if (!userIds.includes(userId)) {
      await db
        .update(xAccountTable)
        .set({
          userIds: [...userIds, userId],
          updatedAt: new Date(),
        })
        .where(eq(xAccountTable.id, accountId));
    }
  }

  async removeUser(accountId: string, userId: string): Promise<void> {
    const account = await this.findById(accountId);
    if (!account || !account.userIds) {
      return;
    }

    await db
      .update(xAccountTable)
      .set({
        userIds: account.userIds.filter((id: string) => id !== userId),
        updatedAt: new Date(),
      })
      .where(eq(xAccountTable.id, accountId));
  }
}
