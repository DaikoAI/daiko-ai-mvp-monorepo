import { env } from "@/env";
import { NewsScraper, NewsScraperDB } from "@daiko-ai/news-scraper";
import { NextResponse } from "next/server";

// Vercel Cron Jobから呼び出されるGETハンドラー
// Vercel.jsonで設定したスケジュールに従って実行される
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    console.log("Starting news scraping cron job...");

    // API KEYの取得
    const apiKey = env.FIRECRAWL_API_KEY || "";
    if (!apiKey) {
      throw new Error("FIRECRAWL_API_KEY is not set");
    }

    // 必要なサービスのインスタンスを作成
    const db = new NewsScraperDB();
    const scraper = new NewsScraper(apiKey);

    // 登録されているサイトをすべて取得
    const sites = await db.getNewsSites();
    console.log(`Found ${sites.length} sites to scrape`);

    if (sites.length === 0) {
      console.log("No sites to scrape");
      return NextResponse.json({
        success: true,
        message: "No news sites found to scrape",
        count: 0,
      });
    }

    // サイトをクロール
    const results = [];
    for (const site of sites) {
      try {
        console.log(`Crawling site ${site.url}`);
        const result = await scraper.scrapeSite(site);

        // 結果を保存
        await db.saveScrapeResult(result);

        // 最終クロール日時を更新
        if (site.id) {
          await db.updateNewsSiteLastCrawled(site.id);
        }

        results.push(result);
        console.log(`Successfully crawled site: ${site.id}`);
      } catch (error) {
        console.error(`Error crawling site ${site.id}:`, error);
      }
    }

    console.log(`News scraping completed. Scraped ${results.length} sites.`);

    return NextResponse.json({
      success: true,
      message: "News scraping completed successfully",
      count: results.length,
    });
  } catch (error) {
    console.error("Error in news scraper cron job:", error);
    return NextResponse.json({ error: "Internal server error", details: String(error) }, { status: 500 });
  }
}

// Vercel Cron Job設定
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5分（スクレイピングには時間がかかることがあるため）
