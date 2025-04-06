import * as dotenv from "dotenv";
import cron from "node-cron";
import { processXScraping } from "./process";

dotenv.config();

/**
 * ローカル環境で実行するためのスクリプト
 * 1. ワンタイム実行モード
 * 2. CRON実行モード
 * 3. 特定アカウント検索モード
 */
async function main() {
  console.log("=== Xスクレイピングジョブ ===");

  // コマンドライン引数を解析
  const args = process.argv.slice(2);
  const isCronMode = args.includes("--cron");
  const accountArg = args.find((arg) => arg.startsWith("--account="));
  const specificAccountId = accountArg?.split("=")[1];

  // 特定アカウントモード
  if (specificAccountId) {
    console.log(`特定のアカウントスクレイピングモード: ${specificAccountId}`);
    const result = await processXScraping({ specificAccountId });
    console.log(result);
    process.exit(result.success ? 0 : 1);
  }

  // CRONモード
  if (isCronMode) {
    const cronExpression = process.env.X_SCRAPER_CRON || "0 */1 * * *"; // デフォルトは1時間ごと
    console.log(`CRONモード: ${cronExpression}`);

    cron.schedule(cronExpression, async () => {
      try {
        console.log(`\n[${new Date().toISOString()}] CRON実行`);
        const result = await processXScraping();
        console.log(result);
      } catch (error) {
        console.error("CRON実行エラー:", error);
      }
    });

    console.log("バックグラウンドで実行中... Ctrl+Cで終了");
    return;
  }

  // ワンタイム実行モード（デフォルト）
  console.log("ワンタイム実行モード");
  const result = await processXScraping();
  console.log(result);
  process.exit(result.success ? 0 : 1);
}

// メイン処理を開始
main().catch((error) => {
  console.error("予期せぬエラーが発生しました:", error);
  process.exit(1);
});
