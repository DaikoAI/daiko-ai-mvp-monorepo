// 環境変数読み込み
import * as dotenv from "dotenv";
dotenv.config();

import { Logger, LogLevel } from "@daiko-ai/shared";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { NewsScraperDB } from "./db";
import { NewsScraper } from "./scraper";

// サーバーのインスタンス作成
const app = new Hono();

// ミドルウェア
app.use("*", honoLogger());
app.use("*", cors());

const logger = new Logger({
  level: LogLevel.INFO,
});

// DB・クローラーのインスタンス
const db = new NewsScraperDB();
const scraper = new NewsScraper(process.env.FIRECRAWL_API_KEY || "");

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

// ニュースサイトを追加またはユーザーを追加
app.post("/sites", async (c) => {
  try {
    const request: {
      url: string;
      userId: string;
    } = await c.req.json();

    // URLで既存のサイトを検索
    const existingSite = await db.findSiteByUrl(request.url);

    let siteId: string;
    if (existingSite) {
      // 既存のサイトが見つかった場合、userIdを追加
      await db.addUserToSite(existingSite.id!, request.userId);
      siteId = existingSite.id!;
    } else {
      // 新規作成
      siteId = await db.saveNewsSite({
        url: request.url,
        userIds: [request.userId],
      });
    }

    return c.json({ id: siteId });
  } catch (error) {
    logger.error("Route:/sites", "Error adding site:", error);
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
    logger.error("Route:/sites", "Error getting sites:", error);
    return c.json({ error: "Failed to get sites" }, 500);
  }
});

// 特定のサイトのクロールを手動トリガー
app.post("/sites/:siteId/scrape", async (c) => {
  try {
    const siteId = c.req.param("siteId");
    const sites = await db.getNewsSites();
    const site = sites.find((s) => s.id === siteId);

    if (!site) {
      return c.json({ error: "Site not found" }, 404);
    }

    const content = await scraper.scrapeSite(site.url);
    await db.updateSiteContent(siteId, content);

    return c.json({ success: true, message: "Site crawled successfully" });
  } catch (error) {
    logger.error("Route:/sites/:siteId/scrape", "Error crawling site:", error);
    return c.json({ error: "Failed to crawl site" }, 500);
  }
});

// 定期クロール用エンドポイント
app.post("/scrape/scheduled", async (c) => {
  try {
    const sites = await db.getNewsSites();
    const results = [];

    for (const site of sites) {
      try {
        logger.info("Route:/scrape/scheduled", `Crawling site ${site.id}`);
        const content = await scraper.scrapeSite(site.url);
        await db.updateSiteContent(site.id!, content);
        results.push({ siteId: site.id, status: "success" });
      } catch (error) {
        logger.error("Route:/scrape/scheduled", `Error crawling site ${site.id}:`, error);
        results.push({ siteId: site.id, status: "error", message: String(error) });
      }
    }

    return c.json({ results });
  } catch (error) {
    logger.error("Route:/scrape/scheduled", "Error in scheduled crawl:", error);
    return c.json({ error: "Failed to execute scheduled crawl" }, 500);
  }
});

// サーバー起動関数
export const startServer = (port = 3000) => {
  serve({
    fetch: app.fetch,
    port,
  });

  logger.info("Route:/", `News Scraper server running on port ${port}`);
};

// このファイルが直接実行された場合にサーバーを起動
if (require.main === module) {
  startServer();
}
