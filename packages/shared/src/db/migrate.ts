import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

/**
 * マイグレーションを実行する関数
 */
async function runMigration() {
  // 環境変数からデータベース接続文字列を取得
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL環境変数が設定されていません。");
  }

  console.log("マイグレーションを開始します...");

  // Neonデータベース接続を作成
  const sql = neon(connectionString);
  // Drizzleインスタンスを作成
  const db = drizzle(sql);

  // マイグレーションを実行
  await migrate(db, { migrationsFolder: "./migrations" });

  console.log("マイグレーションが完了しました！");
  process.exit(0);
}

// エラーハンドリング
runMigration().catch((error) => {
  console.error("マイグレーションでエラーが発生しました:", error);
  process.exit(1);
});
