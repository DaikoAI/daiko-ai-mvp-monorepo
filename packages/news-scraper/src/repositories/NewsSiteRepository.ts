import { BaseRepository, COLLECTIONS, type NewsSite } from "@daiko-ai/shared";

export class NewsSiteRepository extends BaseRepository<NewsSite> {
  constructor() {
    super(COLLECTIONS.NEWS_SITES);
  }

  /**
   * URLでサイトを検索
   * @param url - 検索するURL
   */
  async findByUrl(url: string): Promise<NewsSite | null> {
    return this.findOneByField("url", url);
  }

  /**
   * ユーザーIDに基づいてサイトリストを取得
   * @param userId - ユーザーID
   */
  async findByUserId(userId: string): Promise<NewsSite[]> {
    return this.findWhere("userId", "array-contains", userId);
  }

  /**
   * サイトコンテンツを更新
   * @param siteId - サイトID
   * @param content - 更新するコンテンツ
   */
  async updateContent(siteId: string, content: string): Promise<void> {
    await this.update(siteId, {
      content,
      lastScraped: new Date().toISOString(),
    });
  }

  /**
   * ユーザーをサイトに追加（もし既に存在していなければ）
   * @param siteId - サイトID
   * @param userId - 追加するユーザーID
   */
  async addUserToSite(siteId: string, userId: string): Promise<void> {
    const site = await this.findById(siteId);
    if (!site) {
      throw new Error(`Site with ID ${siteId} not found`);
    }

    const userIds = site.userId || [];
    if (!userIds.includes(userId)) {
      await this.update(siteId, {
        userId: [...userIds, userId],
      });
    }
  }

  /**
   * ユーザーをサイトから削除
   * @param siteId - サイトID
   * @param userId - 削除するユーザーID
   */
  async removeUserFromSite(siteId: string, userId: string): Promise<void> {
    const site = await this.findById(siteId);
    if (!site || !site.userId) {
      return;
    }

    await this.update(siteId, {
      userId: site.userId.filter((id: string) => id !== userId),
    });
  }
}
