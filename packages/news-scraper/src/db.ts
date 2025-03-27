import type { NewsSite } from "@daiko-ai/shared";
import { NewsSiteRepository } from "./repositories/NewsSiteRepository";

export class NewsScraperDB {
  private readonly repository = new NewsSiteRepository();

  async saveNewsSite(site: NewsSite): Promise<string> {
    return this.repository.create(site);
  }

  async getNewsSites(userId?: string): Promise<NewsSite[]> {
    if (userId) {
      return this.repository.findByUserId(userId);
    }
    return this.repository.findAll();
  }

  async updateSiteContent(siteId: string, content: string): Promise<void> {
    await this.repository.updateContent(siteId, content);
  }

  async saveScrapeResult(result: NewsSite): Promise<string> {
    if (result.id) {
      await this.repository.updateContent(result.id, result.content || "");
      return result.id;
    } else {
      throw new Error("Site ID is required to update content");
    }
  }

  // 以下、新規メソッド
  async findSiteByUrl(url: string): Promise<NewsSite | null> {
    return this.repository.findByUrl(url);
  }

  async addUserToSite(siteId: string, userId: string): Promise<void> {
    await this.repository.addUserToSite(siteId, userId);
  }
}
