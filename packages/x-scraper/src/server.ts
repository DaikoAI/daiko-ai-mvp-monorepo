// 環境変数読み込み
import * as dotenv from "dotenv";
dotenv.config();

import { Logger, LogLevel } from "@daiko-ai/shared";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { XScraper } from "./scraper";

// サーバーのインスタンス作成
const app = new Hono();

// ミドルウェア
app.use("*", honoLogger());
app.use("*", cors());

// スクレイパーのインスタンスを作成
const scraper = new XScraper();

// 定期スクレイピングのタイマー
let scheduledTask: NodeJS.Timeout | null = null;

const logger = new Logger({
  level: LogLevel.INFO,
});

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
    logger.info("Route:/check", "Manual check of all accounts triggered");

    // レスポンスを先に返す
    c.status(200);

    // スクレイピングを実行
    scraper.checkXAccounts().catch((error) => {
      logger.error("Route:/check", "Error in check operation:", error);
    });

    return c.json({
      message: "X accounts check has been started",
      success: true,
    });
  } catch (error) {
    logger.error("Route:/check", "Error in /check endpoint:", error);
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

    logger.info("Route:/check-account", `Manual check of account ${xId} triggered`);

    // 特定のアカウントをチェック
    const result = await scraper.checkSingleAccount(xId);

    return c.json({
      success: true,
      message: result ? "Changes detected" : "No changes",
      data: result,
    });
  } catch (error) {
    logger.error("Route:/check-account", "Error in /check-account endpoint:", error);
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

    logger.info("Route:/add-account", `Adding account ${xId} for user ${userId}`);

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
    console.error(error);
    logger.error("Route:/add-account", "Error in /add-account endpoint:", error);
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
      logger.warn("Route:/crawl/scheduled", "Unauthorized scheduled crawl attempt");
      return c.json(
        {
          success: false,
          message: "Unauthorized access",
        },
        401,
      );
    }

    logger.info("Route:/crawl/scheduled", "Scheduled crawl triggered via API");

    // スクレイピングを非同期で実行
    scraper.checkXAccounts().catch((error) => {
      logger.error("Route:/crawl/scheduled", "Error in scheduled crawl:", error);
    });

    return c.json({
      success: true,
      message: "Scheduled crawl started",
    });
  } catch (error) {
    logger.error("Route:/crawl/scheduled", "Error in scheduled crawl endpoint:", error);
    return c.json(
      {
        success: false,
        message: `Error: ${error}`,
      },
      500,
    );
  }
});

// サーバー起動関数
export const startServer = (port = 3000) => {
  serve({
    fetch: app.fetch,
    port,
  });

  logger.info("Route:/", `X Scraper server running on port ${port}`);
};

// プロセス終了時の処理
process.on("SIGTERM", async () => {
  logger.info("Route:/", "SIGTERM received, shutting down gracefully");
  if (scheduledTask) {
    clearInterval(scheduledTask);
  }
  await scraper.closeDriver();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("Route:/", "SIGINT received, shutting down gracefully");
  if (scheduledTask) {
    clearInterval(scheduledTask);
  }
  await scraper.closeDriver();
  process.exit(0);
});

// このファイルが直接実行された場合にサーバーを起動
if (require.main === module) {
  startServer();
}
