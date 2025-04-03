import { NewsSiteInsert, NewsSiteRepository, NewsSiteSelect, db, newsSiteTable } from "@daiko-ai/shared";
import { eq, sql } from "drizzle-orm";

export class PostgresNewsSiteRepository implements NewsSiteRepository {
  constructor() {}

  async findAll(): Promise<NewsSiteSelect[]> {
    return await db.select().from(newsSiteTable);
  }

  async findById(id: string): Promise<NewsSiteSelect | null> {
    const [site] = await db.select().from(newsSiteTable).where(eq(newsSiteTable.id, id)).limit(1);
    return site || null;
  }

  async findOneByField(field: "url", value: string): Promise<NewsSiteSelect | null> {
    const [site] = await db.select().from(newsSiteTable).where(eq(newsSiteTable[field], value)).limit(1);
    return site || null;
  }

  async findByUrl(url: string): Promise<NewsSiteSelect | null> {
    return this.findOneByField("url", url);
  }

  async findWhere<K extends keyof NewsSiteSelect>(
    field: K,
    operator: string,
    value: NewsSiteSelect[K],
  ): Promise<NewsSiteSelect[]> {
    // JSONフィールド内の配列に特定の値が含まれているかを検索する場合
    if (field === "userIds" && operator === "array-contains") {
      // 文字列SQLクエリを使用
      const jsonValue = JSON.stringify([value]);
      const sites = await db.execute(sql`SELECT * FROM news_sites WHERE user_ids::jsonb @> ${jsonValue}`);
      return sites.rows as NewsSiteSelect[];
    }

    throw new Error(`Unsupported query operation: ${String(field)} ${operator} ${String(value)}`);
  }

  async findByUserId(userId: string): Promise<NewsSiteSelect[]> {
    return this.findWhere("userIds" as keyof NewsSiteSelect, "array-contains", userId as any);
  }

  async create(data: NewsSiteInsert): Promise<NewsSiteSelect> {
    const [site] = await db
      .insert(newsSiteTable)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return site;
  }

  async update(id: string, data: Partial<NewsSiteSelect>): Promise<void> {
    const updateData: any = { ...data };

    // updatedAtフィールドが指定されていなければ現在時刻を設定
    if (!updateData.updatedAt) {
      updateData.updatedAt = new Date();
    }

    await db.update(newsSiteTable).set(updateData).where(eq(newsSiteTable.id, id));
  }

  async updateContent(siteId: string, content: string): Promise<void> {
    await this.update(siteId, {
      content,
      lastScraped: new Date(),
    });
  }

  async delete(id: string): Promise<void> {
    await db.delete(newsSiteTable).where(eq(newsSiteTable.id, id));
  }

  async addUserToSite(siteId: string, userId: string): Promise<void> {
    const site = await this.findById(siteId);
    if (!site) {
      throw new Error(`Site with ID ${siteId} not found`);
    }

    const userIds = site.userIds || [];
    if (!userIds.includes(userId)) {
      await this.update(siteId, {
        userIds: [...userIds, userId],
      });
    }
  }

  async removeUserFromSite(siteId: string, userId: string): Promise<void> {
    const site = await this.findById(siteId);
    if (!site || !site.userIds) {
      return;
    }

    await this.update(siteId, {
      userIds: site.userIds.filter((id) => id !== userId),
    });
  }
}
