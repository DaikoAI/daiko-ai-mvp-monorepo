import FirecrawlApp from "@mendable/firecrawl-js";
import type { NewsSite, ScrapeResult } from "./types";

export class NewsScraper {
  private app: FirecrawlApp;

  constructor(apiKey: string) {
    this.app = new FirecrawlApp({ apiKey });
  }

  async scrapeSite(site: NewsSite): Promise<ScrapeResult> {
    console.log(`Scraping site ${site.url}`);
    const response = await this.app.scrapeUrl(site.url, {
      formats: ["markdown", "html"],
    });

    if (!response.success) {
      throw new Error(`Failed to scrape ${site.url}: ${response.error}`);
    }

    const content = response.markdown;

    return {
      id: "", // This will be set by Firestore
      siteId: site.id || "",
      url: site.url,
      content: content || "",
      timestamp: new Date().toISOString(),
    };
  }
}
