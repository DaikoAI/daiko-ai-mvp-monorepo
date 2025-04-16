import { NeynarAdapter } from "../adapters/neynar";
import { FarcasterRepository } from "../repositories/farcaster";
import { ScrapingResult } from "../types";

/**
 * レートリミット考慮: 1分あたり300リクエスト以内（Starterプラン）
 * 1リクエストごとにsleepを挟む・バッチサイズを調整
 */
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_SLEEP_MS = 250; // 4req/sec

// 必要最小限のcast型
interface SimpleCast {
  hash: string;
  author: { fid: number };
  text: string;
  thread_hash?: string | null;
  timestamp: string;
}

export class FarcasterScraper {
  constructor(
    private readonly repository: FarcasterRepository,
    private readonly neynar: NeynarAdapter,
  ) {
    this.repository = new FarcasterRepository();
    this.neynar = new NeynarAdapter();
  }

  /**
   * 監視アカウント（isMonitored=true）のcast/プロフィールを最新化
   */
  async scrapeMonitoredAccounts(batchSize = DEFAULT_BATCH_SIZE): Promise<ScrapingResult[]> {
    const monitored = await this.repository.getMonitoredUsers();
    const results: ScrapingResult[] = [];
    for (let i = 0; i < monitored.length; i += batchSize) {
      const batch = monitored.slice(i, i + batchSize);
      for (const user of batch) {
        try {
          // プロフィール取得・保存
          const profile = await this.neynar.getUserInfo(user.username);

          await this.repository.saveUser({
            id: user.id,
            fid: profile.fid,
            username: profile.username,
            displayName: profile.display_name,
            avatar: profile.pfp_url,
            bio: profile.profile.bio.text,
            followers: profile.follower_count,
            following: profile.following_count,
            lastFetchedAt: new Date(),
            isMonitored: true,
          });

          // 最新cast取得・保存（最小カラムのみ）
          const casts: SimpleCast[] = await this.neynar.getUserCasts(profile.fid, 1);
          if (casts.length > 0) {
            const cast = casts[0];
            const newCast = {
              hash: cast.hash,
              authorFid: cast.author.fid,
              text: cast.text,
              replyTo: cast.thread_hash ?? undefined,
              timestamp: new Date(cast.timestamp),
              fetchedAt: new Date(),
              isLatest: true,
            };
            await this.repository.saveCast(newCast);
          }
          results.push({ success: true, castsCount: 1 });
        } catch (error) {
          results.push({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        await this.sleep(DEFAULT_SLEEP_MS);
      }
    }
    return results;
  }

  /**
   * isActiveなキーワードごとにNeynarでcast検索し保存
   */
  async scrapeActiveKeywords(limit = 200, batchSize = DEFAULT_BATCH_SIZE): Promise<ScrapingResult[]> {
    const keywords = await this.repository.getActiveKeywords();
    const results: ScrapingResult[] = [];
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      for (const keyword of batch) {
        try {
          const casts: SimpleCast[] = await this.neynar.searchCasts(keyword.keyword, limit);
          const castsToSave = casts.map((cast) => ({
            hash: cast.hash,
            authorFid: cast.author.fid,
            text: cast.text,
            replyTo: cast.thread_hash ?? undefined,
            timestamp: new Date(cast.timestamp),
            fetchedAt: new Date(),
            isLatest: false,
          }));
          await this.repository.saveCasts(castsToSave);
          await this.repository.updateKeywordLastScanned(keyword.keyword);
          results.push({ success: true, castsCount: castsToSave.length });
        } catch (error) {
          results.push({ success: false, error: error instanceof Error ? error.message : String(error) });
        }
        await this.sleep(DEFAULT_SLEEP_MS);
      }
    }
    return results;
  }

  private async sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
