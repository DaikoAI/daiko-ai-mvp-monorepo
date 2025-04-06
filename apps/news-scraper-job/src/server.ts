import "dotenv/config";
import cron from "node-cron";
import { processNewsScraping } from "./process";

/**
 * ローカル環境で実行するためのスクリプト
 * 1. ワンタイム実行モード
 * 2. CRON実行モード
 * 3. 特定サイト検索モード
 */
async function main() {
  console.log("=== ニューススクレイピングジョブ ===");

  // コマンドライン引数を解析
  const args = process.argv.slice(2);
  const isCronMode = args.includes("--cron");
  const siteArg = args.find((arg) => arg.startsWith("--site="));
  const specificSiteId = siteArg?.split("=")[1];

  // 特定サイトモード
  if (specificSiteId) {
    console.log(`特定のサイトスクレイピングモード: ${specificSiteId}`);
    const result = await processNewsScraping({ specificSiteId });
    console.log(result);
    process.exit(result.success ? 0 : 1);
    return;
  }

  // CRONモード
  if (isCronMode) {
    const cronExpression = process.env.NEWS_SCRAPER_CRON || "0 */3 * * *"; // デフォルトは3時間ごと
    console.log(`CRONモード: ${cronExpression}`);

    cron.schedule(cronExpression, async () => {
      try {
        console.log(`\n[${new Date().toISOString()}] CRON実行`);
        const result = await processNewsScraping();
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
  const result = await processNewsScraping();
  console.log(result);
  process.exit(result.success ? 0 : 1);
}

// メイン処理を開始
main().catch((error) => {
  console.error("予期せぬエラーが発生しました:", error);
  process.exit(1);
});
