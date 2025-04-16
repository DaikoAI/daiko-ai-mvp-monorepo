import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";
import { FeedType } from "@neynar/nodejs-sdk/build/api/models/feed-type";

export class NeynarAdapter {
  private client: NeynarAPIClient;

  constructor() {
    this.client = new NeynarAPIClient(
      new Configuration({
        apiKey: process.env.NEYNAR_API_KEY!,
      }),
    );
  }

  async getUserCasts(fid: number, limit: number = 200) {
    try {
      const response = await this.client.fetchFeed({
        fid,
        feedType: FeedType.Following,
        limit,
      });
      return response.casts;
    } catch (error) {
      console.error(`Error fetching casts for user ${fid}:`, error);
      throw error;
    }
  }

  async searchCasts(keyword: string, limit: number = 200) {
    try {
      const { result } = await this.client.searchCasts({ limit, q: keyword });
      return result.casts;
    } catch (error) {
      console.error(`Error searching casts for keyword ${keyword}:`, error);
      throw error;
    }
  }

  async getUserInfo(username: string) {
    try {
      const response = await this.client.lookupUserByUsername({ username });
      return response.user;
    } catch (error) {
      console.error(`Error fetching user info for username ${username}:`, error);
      throw error;
    }
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
