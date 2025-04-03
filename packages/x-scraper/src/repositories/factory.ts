import { TweetRepository, XAccountRepository } from "@daiko-ai/shared";
import { PostgresTweetRepository } from "./TweetRepository";
import { PostgresXAccountRepository } from "./XAccountRepository";

/**
 * リポジトリの生成を管理するファクトリークラス
 */
export class RepositoryFactory {
  private static instance: RepositoryFactory;

  private constructor() {}

  /**
   * ファクトリークラスのシングルトンインスタンスを取得
   */
  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  /**
   * XAccountRepositoryインスタンスを取得
   */
  public getXAccountRepository(): XAccountRepository {
    return new PostgresXAccountRepository();
  }

  /**
   * TweetRepositoryインスタンスを取得
   */
  public getTweetRepository(): TweetRepository {
    return new PostgresTweetRepository();
  }
}

// 利用しやすいようにデフォルトのファクトリーインスタンスをエクスポート
export const repositoryFactory = RepositoryFactory.getInstance();
