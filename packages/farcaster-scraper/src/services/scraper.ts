import { castKeywordsTable, db, farcasterCastsTable, farcasterKeywordsTable } from "@daiko-ai/shared";
import { eq } from "drizzle-orm";
import { NeynarAdapter } from "../adapters/neynar";
import { SearchcasterAdapter } from "../adapters/searchcaster";
import { FarcasterRepository } from "../repositories/farcaster";
import type { ScrapingResult, SearchcasterCast } from "../types";

/**
 * レートリミット考慮: 1分あたり300リクエスト以内（Starterプラン）
 * 1リクエストごとにsleepを挟む・バッチサイズを調整
 */
const DEFAULT_BATCH_SIZE = 10;
const DEFAULT_SLEEP_MS = 500; // 2req/sec

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
  ) {}

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
              author: profile.username,
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
          const casts = await this.neynar.searchCasts(keyword.keyword, limit);
          const castsToSave = casts.map((cast) => ({
            hash: cast.hash,
            author: cast.author.username,
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

  /**
   * isActiveなキーワードごとにSearchcasterでcast検索し保存
   * cast_keywords中間テーブルにもリレーションを保存
   */
  async scrapeActiveKeywordsWithSearchcaster(
    searchcaster: SearchcasterAdapter,
    limit = 200,
    batchSize = DEFAULT_BATCH_SIZE,
  ): Promise<ScrapingResult[]> {
    const keywords = await this.repository.getActiveKeywords();
    const results: ScrapingResult[] = [];
    for (let i = 0; i < keywords.length; i += batchSize) {
      const batch = keywords.slice(i, i + batchSize);
      for (const keyword of batch) {
        try {
          // Searchcasterで検索
          const casts: SearchcasterCast[] = await searchcaster.searchByKeyword(keyword.keyword, { count: limit });
          for (const cast of casts) {
            // cast本体を保存しid取得
            const [savedCast] = await db
              .insert(farcasterCastsTable)
              .values({
                hash: cast.uri,
                author: cast.body.username,
                authorFid: undefined, // 必要に応じてcast.body.fid等をセット
                text: cast.body.data.text,
                replyTo: undefined,
                timestamp: new Date(cast.body.publishedAt),
                fetchedAt: new Date(),
                isLatest: false,
              })
              .onConflictDoUpdate({
                target: farcasterCastsTable.hash,
                set: {
                  text: cast.body.data.text,
                  replyTo: undefined,
                  timestamp: new Date(cast.body.publishedAt),
                  fetchedAt: new Date(),
                  isLatest: false,
                  updatedAt: new Date(),
                },
              })
              .returning({ id: farcasterCastsTable.id });
            // keywordのid取得
            const [keywordRow] = await db
              .select({ id: farcasterKeywordsTable.id })
              .from(farcasterKeywordsTable)
              .where(eq(farcasterKeywordsTable.keyword, keyword.keyword));
            // 中間テーブルに保存
            if (savedCast && keywordRow) {
              await db
                .insert(castKeywordsTable)
                .values({ castId: savedCast.id, keywordId: keywordRow.id })
                .onConflictDoNothing();
            }
          }
          await this.repository.updateKeywordLastScanned(keyword.keyword);
          results.push({ success: true, castsCount: casts.length });
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
