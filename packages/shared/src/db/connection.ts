import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * データベース接続を作成する関数
 *
 * @param connectionString - データベース接続文字列（指定しない場合は環境変数から取得）
 * @returns Drizzleインスタンス
 */
export function createDbConnection(connectionString?: string) {
  // 接続文字列が指定されていない場合は環境変数から取得
  const dbUrl = connectionString || process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("データベース接続文字列が指定されていません。環境変数 DATABASE_URL を設定してください。");
  }

  // Neonの接続クライアントを作成
  const sql = neon(dbUrl);

  // Drizzleのインスタンスを作成して返す
  return drizzle(sql, { schema });
}

// デフォルトのデータベース接続をエクスポート
export const db = createDbConnection();
