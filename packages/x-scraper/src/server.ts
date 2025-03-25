import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { config, validateConfig } from "./config";
import { saveSystemLog } from "./db";
import { XScraper } from "./scraper";
import loggerUtil from "./utils/logger";

// 環境変数読み込み
import * as dotenv from "dotenv";
dotenv.config();

// サーバーのインスタンス作成
const app = new Hono();

// ミドルウェア
app.use("*", logger());
app.use("*", cors());

try {
  // 設定の検証
  validateConfig();
} catch (error) {
  loggerUtil.error("Configuration error:", error);
  process.exit(1);
}

// スクレイパーのインスタンスを作成
const scraper = new XScraper();

// 定期スクレイピングのタイマー
let scheduledTask: NodeJS.Timeout | null = null;

// ルートエンドポイント
app.get("/", (c) => {
  return c.json({
    status: "X Scraper is running",
    version: "1.0.0",
    endpoints: [
      {
        method: "GET",
        path: "/health",
        description: "Health check endpoint",
      },
      {
        method: "GET",
        path: "/check",
        description: "Check all registered X accounts",
      },
      {
        method: "POST",
        path: "/check-account",
        description: "Check a specific X account",
      },
      {
        method: "POST",
        path: "/add-account",
        description: "Add an X account to watch list",
      },
    ],
  });
});

// ヘルスチェックエンドポイント
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// すべてのアカウントをチェック
app.get("/check", async (c) => {
  try {
    loggerUtil.info("Manual check of all accounts triggered");

    // レスポンスを先に返す
    c.status(200);

    // スクレイピングを実行
    scraper.checkXAccounts().catch((error) => {
      loggerUtil.error("Error in check operation:", error);
    });

    return c.json({
      message: "X accounts check has been started",
      success: true,
    });
  } catch (error) {
    loggerUtil.error("Error in /check endpoint:", error);
    return c.json(
      {
        success: false,
        message: `Error: ${error}`,
      },
      500,
    );
  }
});

// 特定のアカウントをチェック
app.post("/check-account", async (c) => {
  try {
    const { xId } = await c.req.json();

    if (!xId) {
      return c.json(
        {
          success: false,
          message: "Missing xId parameter",
        },
        400,
      );
    }

    loggerUtil.info(`Manual check of account ${xId} triggered`);

    // 特定のアカウントをチェック
    const result = await scraper.checkSingleAccount(xId);

    return c.json({
      success: true,
      message: result ? "Changes detected" : "No changes",
      data: result,
    });
  } catch (error) {
    loggerUtil.error("Error in /check-account endpoint:", error);
    return c.json(
      {
        success: false,
        message: `Error: ${error}`,
      },
      500,
    );
  }
});

// アカウントを追加
app.post("/add-account", async (c) => {
  try {
    const { xId, userId } = await c.req.json();

    if (!xId || !userId) {
      return c.json(
        {
          success: false,
          message: "Missing xId or userId parameter",
        },
        400,
      );
    }

    loggerUtil.info(`Adding account ${xId} for user ${userId}`);

    // アカウントを追加
    const success = await scraper.addAccount(xId, userId);

    if (success) {
      return c.json({
        success: true,
        message: "Account added or updated successfully",
      });
    } else {
      return c.json(
        {
          success: false,
          message: "Failed to add account",
        },
        500,
      );
    }
  } catch (error) {
    loggerUtil.error("Error in /add-account endpoint:", error);
    return c.json(
      {
        success: false,
        message: `Error: ${error}`,
      },
      500,
    );
  }
});

// 定期スクレイピング用のエンドポイント
app.post("/crawl/scheduled", async (c) => {
  try {
    // セキュリティキーのチェック
    const securityKey = c.req.query("key");

    if (!securityKey || securityKey !== process.env.CRON_SECURITY_KEY) {
      loggerUtil.warn("Unauthorized scheduled crawl attempt");
      return c.json(
        {
          success: false,
          message: "Unauthorized access",
        },
        401,
      );
    }

    loggerUtil.info("Scheduled crawl triggered via API");
    await saveSystemLog("Starting scheduled crawl via API");

    // スクレイピングを非同期で実行
    scraper.checkXAccounts().catch((error) => {
      loggerUtil.error("Error in scheduled crawl:", error);
    });

    return c.json({
      success: true,
      message: "Scheduled crawl started",
    });
  } catch (error) {
    loggerUtil.error("Error in scheduled crawl endpoint:", error);
    return c.json(
      {
        success: false,
        message: `Error: ${error}`,
      },
      500,
    );
  }
});

// 定期スクレイピングの開始（ローカル開発環境用）
const startScheduledTask = () => {
  if (scheduledTask) {
    clearInterval(scheduledTask);
  }

  const intervalMinutes = config.checkIntervalMinutes;
  const intervalMs = intervalMinutes * 60 * 1000;

  loggerUtil.info(`Setting up scheduled task to run every ${intervalMinutes} minutes`);

  // 定期的にスクレイピングを実行
  scheduledTask = setInterval(async () => {
    try {
      loggerUtil.info("Running scheduled X scraper check");
      await saveSystemLog("Starting scheduled check");
      await scraper.checkXAccounts();
    } catch (error) {
      loggerUtil.error("Error in scheduled task:", error);
    }
  }, intervalMs);
};

// サーバー起動関数
export const startServer = (port = config.port) => {
  serve({
    fetch: app.fetch,
    port,
  });

  loggerUtil.info(`X Scraper server running on port ${port}`);
  loggerUtil.info(`Environment: ${config.nodeEnv}`);

  // 開発環境では定期スクレイピングを開始
  if (config.nodeEnv !== "production") {
    startScheduledTask();
  }

  // 開発環境では初回起動時にチェックを実行
  if (config.nodeEnv === "development") {
    loggerUtil.info("Running initial check on startup");
    scraper.checkXAccounts().catch((error) => {
      loggerUtil.error("Error in initial check:", error);
    });
  }
};

// プロセス終了時の処理
process.on("SIGTERM", async () => {
  loggerUtil.info("SIGTERM received, shutting down gracefully");
  if (scheduledTask) {
    clearInterval(scheduledTask);
  }
  await scraper.closeDriver();
  process.exit(0);
});

process.on("SIGINT", async () => {
  loggerUtil.info("SIGINT received, shutting down gracefully");
  if (scheduledTask) {
    clearInterval(scheduledTask);
  }
  await scraper.closeDriver();
  process.exit(0);
});
