import { defaultLogger } from "@daiko-ai/shared";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { NewsScraperDB } from "./db";
import { NewsScraper } from "./scraper";
import type { NewsSite } from "./types";

// 環境変数読み込み
import * as dotenv from "dotenv";
dotenv.config();

// サーバーのインスタンス作成
const app = new Hono();

// ミドルウェア
app.use("*", logger());
app.use("*", cors());

// DB・クローラーのインスタンス
const db = new NewsScraperDB();
const crawler = new NewsScraper(process.env.FIRECRAWL_API_KEY || "");

// ルートエンドポイント
app.get("/", (c) => {
  return c.json({
    status: "News Scraper API is running",
    version: "1.0.0",
    endpoints: [
      {
        method: "GET",
        path: "/health",
        description: "Health check endpoint",
      },
      {
        method: "POST",
        path: "/sites",
        description: "Add a new news site",
      },
      {
        method: "GET",
        path: "/sites",
        description: "Get all news sites for a user",
      },
      {
        method: "POST",
        path: "/sites/:siteId/crawl",
        description: "Manually trigger crawl for a site",
      },
    ],
  });
});

// ヘルスチェックエンドポイント
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// ニュースサイトを追加
app.post("/sites", async (c) => {
  try {
    const site: NewsSite = await c.req.json();
    const siteId = await db.saveNewsSite(site);
    return c.json({ id: siteId });
  } catch (error) {
    defaultLogger.error("Error adding site:", { error });
    return c.json({ error: "Failed to add site" }, 500);
  }
});

// ユーザーのニュースサイトを取得
app.get("/sites", async (c) => {
  try {
    const userId = c.req.query("userId");
    const sites = await db.getNewsSites(userId);
    return c.json(sites);
  } catch (error) {
    defaultLogger.error("Error getting sites:", { error });
    return c.json({ error: "Failed to get sites" }, 500);
  }
});

// 特定のサイトのクロールを手動トリガー
app.post("/sites/:siteId/crawl", async (c) => {
  try {
    const siteId = c.req.param("siteId");
    const sites = await db.getNewsSites();
    const site = sites.find((s) => s.id === siteId);

    if (!site) {
      return c.json({ error: "Site not found" }, 404);
    }

    const result = await crawler.scrapeSite(site);
    await db.saveScrapeResult(result);
    await db.updateNewsSiteLastCrawled(siteId);

    return c.json(result);
  } catch (error) {
    defaultLogger.error("Error crawling site:", { error });
    return c.json({ error: "Failed to crawl site" }, 500);
  }
});

// 定期クロール用エンドポイント
app.post("/crawl/scheduled", async (c) => {
  try {
    // セキュリティキーのチェック
    const securityKey = c.req.query("key");

    if (!securityKey || securityKey !== process.env.CRON_SECURITY_KEY) {
      defaultLogger.warn("Unauthorized scheduled crawl attempt");
      return c.json(
        {
          success: false,
          message: "Unauthorized access",
        },
        401,
      );
    }

    const sites = await db.getNewsSites();
    const results = [];

    for (const site of sites) {
      try {
        defaultLogger.info(`Crawling site ${site.id}`);
        const result = await crawler.scrapeSite(site);
        await db.saveScrapeResult(result);
        await db.updateNewsSiteLastCrawled(site.id || "");
        results.push({ siteId: site.id, status: "success" });
      } catch (error) {
        defaultLogger.error(`Error crawling site ${site.id}:`, { error });
        results.push({ siteId: site.id, status: "error" });
      }
    }

    return c.json({ results });
  } catch (error) {
    defaultLogger.error("Error in scheduled crawl:", { error });
    return c.json({ error: "Failed to execute scheduled crawl" }, 500);
  }
});

// サーバー起動関数
export const startServer = (port = 3000) => {
  serve({
    fetch: app.fetch,
    port,
  });

  defaultLogger.info(`News Scraper server running on port ${port}`);
};
