import { Configuration, NeynarAPIClient } from "@neynar/nodejs-sdk";
import { FeedType } from "@neynar/nodejs-sdk/build/api/models/feed-type";
import pc from "picocolors";

export class NeynarAdapter {
  private client: NeynarAPIClient;

  constructor() {
    this.client = new NeynarAPIClient(
      new Configuration({
        apiKey: process.env.NEYNAR_API_KEY!,
      }),
    );
  }

  private async withRetry<T>(fn: () => Promise<T>, context: string): Promise<T> {
    let attempt = 0;
    const maxAttempts = 3;
    const sleepTimes = [2000, 4000, 8000];
    while (true) {
      try {
        return await fn();
      } catch (error: any) {
        attempt++;
        const status = error?.response?.status;
        if (status === 429 && attempt < maxAttempts) {
          console.log(
            pc.yellow(`[RATE LIMIT] ${context} - retrying in ${sleepTimes[attempt - 1] / 1000}s (attempt ${attempt})`),
          );
          await this.sleep(sleepTimes[attempt - 1]);
          continue;
        }
        if (status === 402) {
          console.error(
            pc.red(
              `[PAYMENT REQUIRED] ${context} - Your plan does not allow this operation. See: https://neynar.com/pricing`,
            ),
          );
          throw error;
        }
        console.error(pc.red(`[ERROR] ${context} - ${error.message}`));
        throw error;
      }
    }
  }

  async getUserCasts(fid: number, limit: number = 200) {
    return this.withRetry(async () => {
      const response = await this.client.fetchFeed({
        fid,
        feedType: FeedType.Following,
        limit,
      });
      console.log(pc.green(`[SUCCESS] fetched casts for user ${fid}`));
      return response.casts;
    }, `fetchUserCasts(fid=${fid})`);
  }

  async searchCasts(keyword: string, limit: number = 200) {
    return this.withRetry(async () => {
      const { result } = await this.client.searchCasts({ limit, q: keyword });
      console.log(pc.green(`[SUCCESS] searched casts for keyword '${keyword}'`));
      return result.casts;
    }, `searchCasts(keyword=${keyword})`);
  }

  async getUserInfo(username: string) {
    return this.withRetry(async () => {
      const response = await this.client.lookupUserByUsername({ username });
      console.log(pc.green(`[SUCCESS] fetched user info for username '${username}'`));
      return response.user;
    }, `getUserInfo(username=${username})`);
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
