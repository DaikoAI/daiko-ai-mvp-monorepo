import { XAccountRepository } from "@daiko-ai/shared";
import { PostgresXAccountRepository } from "./XAccountRepository";

// PostgreSQLリポジトリファクトリークラス
export class RepositoryFactory {
  private static instance: RepositoryFactory;

  private constructor() {}

  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory();
    }
    return RepositoryFactory.instance;
  }

  // XAccountRepositoryの取得
  public getXAccountRepository(): XAccountRepository {
    return new PostgresXAccountRepository();
  }
}

// 利用しやすいようにエクスポート
export const repositoryFactory = RepositoryFactory.getInstance();
