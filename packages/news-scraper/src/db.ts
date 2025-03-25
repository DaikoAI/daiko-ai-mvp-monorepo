import { getAdminFirestore } from "@daiko-ai/shared";
import type { NewsSite, ScrapeResult } from "./types";

export class NewsScraperDB {
  private readonly NEWS_SITES_COLLECTION = "news_sites";
  private readonly CRAWL_RESULTS_COLLECTION = "crawl_results";
  private readonly db = getAdminFirestore();

  async saveNewsSite(site: NewsSite): Promise<string> {
    const docRef = await this.db.collection(this.NEWS_SITES_COLLECTION).add({
      ...site,
      createdAt: new Date(),
    });
    return docRef.id;
  }

  async getNewsSites(userId?: string): Promise<NewsSite[]> {
    const collectionRef = this.db.collection(this.NEWS_SITES_COLLECTION);

    let query = userId ? collectionRef.where("userId", "==", userId) : collectionRef;

    const snapshot = await query.get();
    return snapshot.docs.map(
      (doc) =>
        ({
          ...doc.data(),
          id: doc.id,
        }) as NewsSite,
    );
  }

  async saveScrapeResult(result: ScrapeResult): Promise<string> {
    const docRef = await this.db.collection(this.CRAWL_RESULTS_COLLECTION).add({
      ...result,
      createdAt: new Date(),
    });
    return docRef.id;
  }

  async updateNewsSiteLastCrawled(siteId: string): Promise<void> {
    await this.db.collection(this.NEWS_SITES_COLLECTION).doc(siteId).update({
      lastCrawled: new Date().toISOString(),
      updatedAt: new Date(),
    });
  }
}
