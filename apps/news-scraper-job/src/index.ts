import { NewsScraper, NewsScraperDB } from "@daiko-ai/news-scraper";
import * as dotenv from "dotenv";

dotenv.config();

async function runNewsScraperJob() {
  try {
    console.log("Starting news scraping cron job...");

    // API KEYの取得
    const apiKey = process.env.FIRECRAWL_API_KEY || "";
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
      return;
    }

    // サイトをクロール
    const results = [];
    for (const site of sites) {
      try {
        console.log(`Scraping site ${site.url}`);
        const result = await scraper.scrapeSite(site);

        // 結果を保存
        await db.saveScrapeResult(result);

        results.push(result);
        console.log(`Successfully scraped site: ${site.id}`);
      } catch (error) {
        console.error(`Error scraping site ${site.id}:`, error);
      }
    }

    console.log(`News scraping completed. Scraped ${results.length} sites.`);
  } catch (error) {
    console.error("Error in news scraper cron job:", error);
    process.exit(1);
  }
}

runNewsScraperJob();
