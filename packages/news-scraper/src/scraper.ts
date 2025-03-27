import type { NewsSite } from "@daiko-ai/shared";
import FirecrawlApp from "@mendable/firecrawl-js";

export class NewsScraper {
  private app: FirecrawlApp;

  constructor(apiKey: string) {
    this.app = new FirecrawlApp({ apiKey });
  }

  async scrapeSite(urlOrSite: string | NewsSite): Promise<string> {
    const url = typeof urlOrSite === "string" ? urlOrSite : urlOrSite.url;
    console.log(`Scraping site ${url}`);
    try {
      const response = await this.app.scrapeUrl(url, {
        formats: ["markdown", "html"],
      });

      if (!response.success) {
        throw new Error(`Failed to scrape ${url}: ${response.error}`);
      }

      const content = response.markdown;
      if (!content) {
        throw new Error(`No content found for ${url}`);
      }

      return content;
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      throw error;
    }
  }
}
