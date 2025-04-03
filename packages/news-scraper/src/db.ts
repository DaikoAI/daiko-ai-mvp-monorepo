import type { NewsSiteInsert, NewsSiteSelect } from "@daiko-ai/shared";
import { PostgresNewsSiteRepository } from "./repositories/NewsSiteRepository";

export class NewsScraperDB {
  private readonly repository = new PostgresNewsSiteRepository();

  async saveNewsSite(site: NewsSiteInsert): Promise<string> {
    const newSite = await this.repository.create(site);
    return newSite.id;
  }

  async getNewsSites(userId?: string): Promise<NewsSiteSelect[]> {
    if (userId) {
      return this.repository.findByUserId(userId);
    }
    return this.repository.findAll();
  }

  async updateSiteContent(siteId: string, content: string): Promise<void> {
    await this.repository.updateContent(siteId, content);
  }

  async saveScrapeResult(result: NewsSiteSelect): Promise<string> {
    if (result.id) {
      await this.repository.updateContent(result.id, result.content || "");
      return result.id;
    } else {
      throw new Error("Site ID is required to update content");
    }
  }

  // 以下、新規メソッド
  async findSiteByUrl(url: string): Promise<NewsSiteSelect | null> {
    return this.repository.findByUrl(url);
  }

  async addUserToSite(siteId: string, userId: string): Promise<void> {
    await this.repository.addUserToSite(siteId, userId);
  }
}
