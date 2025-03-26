import { XScraper } from "@daiko-ai/x-scraper";
import * as dotenv from "dotenv";

dotenv.config();

async function runXScraperJob() {
  try {
    console.log("Starting X (Twitter) scraping cron job...");

    // スクレイパーのインスタンスを作成
    const scraper = new XScraper();

    // 登録されているXアカウントをスクレイピング
    await scraper.checkXAccounts();

    console.log("X (Twitter) scraping completed successfully");
  } catch (error) {
    console.error("Error in X scraper cron job:", error);
    process.exit(1);
  }
}

runXScraperJob();
