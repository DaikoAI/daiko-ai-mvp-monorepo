import { BaseRepository, COLLECTIONS, type XAccount } from "@daiko-ai/shared";

export class XAccountRepository extends BaseRepository<XAccount> {
  constructor() {
    super(COLLECTIONS.X_ACCOUNTS);
  }

  /**
   * 特定のユーザーが監視しているアカウントを取得
   * @param userId - ユーザーID
   */
  async findByUserId(userId: string): Promise<XAccount[]> {
    return this.findWhere("userIds", "array-contains", userId);
  }

  /**
   * アカウントの最新コンテンツを更新
   * @param accountId - アカウントID
   * @param content - 新しいツイートコンテンツ
   */
  async updateLastContent(accountId: string, content: any[]): Promise<void> {
    await this.update(accountId, {
      lastContent: content,
    });
  }

  /**
   * ユーザーをアカウント監視者として追加
   * @param accountId - アカウントID
   * @param userId - 追加するユーザーID
   */
  async addUser(accountId: string, userId: string): Promise<void> {
    const account = await this.findById(accountId);
    if (!account) {
      throw new Error(`Account with ID ${accountId} not found`);
    }

    const userIds = account.userIds || [];
    if (!userIds.includes(userId)) {
      await this.update(accountId, {
        userIds: [...userIds, userId],
      });
    }
  }

  /**
   * アカウント監視者からユーザーを削除
   * @param accountId - アカウントID
   * @param userId - 削除するユーザーID
   */
  async removeUser(accountId: string, userId: string): Promise<void> {
    const account = await this.findById(accountId);
    if (!account || !account.userIds) {
      return;
    }

    await this.update(accountId, {
      userIds: account.userIds.filter((id: string) => id !== userId),
    });
  }
}
