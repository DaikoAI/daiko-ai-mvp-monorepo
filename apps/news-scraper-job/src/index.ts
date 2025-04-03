import { NewsScraper, NewsScraperDB } from "@daiko-ai/news-scraper";
import * as dotenv from "dotenv";

dotenv.config();

async function runNewsScraperJob() {
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
      const content = await scraper.scrapeSite(site);

      if (site.id) {
        // saveScrapeResultメソッドを使用して既存のサイトを更新
        await db.saveScrapeResult({
          ...site,
          content: content,
          lastScraped: new Date(),
        });

        results.push({ siteId: site.id, status: "success" });
        console.log(`Successfully scraped site: ${site.id}`);
      }
    } catch (error) {
      console.error(`Error scraping site ${site.id}:`, error);
      results.push({ siteId: site.id, status: "error", message: String(error) });
    }
  }

  console.log(`News scraping completed. Scraped ${results.length} sites.`);
}

runNewsScraperJob()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error in news scraper cron job:", error);
    process.exit(1);
  });
