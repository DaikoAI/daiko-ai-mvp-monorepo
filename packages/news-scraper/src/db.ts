import type { CollectionName, NewsSite, ScrapeResult } from "@daiko-ai/shared";
import { COLLECTIONS, getAdminFirestore } from "@daiko-ai/shared";

export class NewsScraperDB {
  private readonly NEWS_SITES_COLLECTION: CollectionName = COLLECTIONS.NEWS;
  private readonly CRAWL_RESULTS_COLLECTION: CollectionName = COLLECTIONS.CRAWL_RESULTS;
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
