import "dotenv/config";
import cron from "node-cron";
import { TokenPriceService } from "./services/token-price-service";

// サービスのインスタンスを作成
const tokenPriceService = new TokenPriceService();

/**
 * アプリケーションのメインエントリーポイント
 * 環境変数に基づいて、CRON実行かワンタイム実行かを決定
 */
async function main() {
  console.log("=== Jupiter価格更新バッチジョブ ===");
  console.log(`実行時刻: ${new Date().toISOString()}`);

  // 環境変数からcron式を取得
  const cronExpression = process.env.PRICE_UPDATE_CRON || "*/10 * * * *"; // デフォルトは10分ごと
  const isCronMode = process.argv.includes("--cron");

  if (isCronMode) {
    console.log(`CRON実行モード: ${cronExpression} で開始します`);

    // cronスケジュールを設定
    cron.schedule(cronExpression, async () => {
      try {
        console.log(`\n[${new Date().toISOString()}] 定期実行: トークン価格更新を開始します`);
        await tokenPriceService.updateAllTokenPrices();
        console.log(`[${new Date().toISOString()}] 定期実行: トークン価格更新が完了しました`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] 定期実行でエラーが発生しました:`, error);
      }
    });

    console.log("バッチジョブがバックグラウンドで実行されています。Ctrl+Cで終了します。");
  } else {
    console.log("ワンタイム実行モード: 1回だけ実行します");

    try {
      await tokenPriceService.updateAllTokenPrices();
      console.log("ワンタイム実行が完了しました");
      process.exit(0);
    } catch (error) {
      console.error("ワンタイム実行中にエラーが発生しました:", error);
      process.exit(1);
    }
  }
}

// 引数に特定のトークンアドレスが指定されている場合は、そのトークンの価格だけを更新
const specificTokenAddress = process.argv.find((arg) => arg.startsWith("--token="))?.split("=")[1];
if (specificTokenAddress) {
  console.log(`特定のトークン ${specificTokenAddress} の価格を取得します`);
  tokenPriceService
    .getTokenPrice(specificTokenAddress)
    .then((price) => {
      if (price) {
        console.log(`トークン ${specificTokenAddress} の価格: ${price} USD`);
      } else {
        console.log(`トークン ${specificTokenAddress} の価格は取得できませんでした`);
      }
      process.exit(0);
    })
    .catch((error) => {
      console.error("エラーが発生しました:", error);
      process.exit(1);
    });
} else {
  // メイン処理を開始
  main().catch((error) => {
    console.error("アプリケーション実行中にエラーが発生しました:", error);
    process.exit(1);
  });
}
