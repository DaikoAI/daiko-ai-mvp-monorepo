import { Logger, LogLevel, Tweet, XAccountInsert, XAccountSelect } from "@daiko-ai/shared";
import { repositoryFactory } from "./repositories/factory";

// リポジトリインスタンスを取得
export const xAccountRepository = repositoryFactory.getXAccountRepository();
export const tweetRepository = repositoryFactory.getTweetRepository();

// ロガーインスタンス
const log = new Logger({
  level: LogLevel.INFO,
});

/**
 * すべてのXアカウントを取得
 */
export const getAllXAccounts = async (): Promise<XAccountSelect[]> => {
  try {
    return await xAccountRepository.findAll();
  } catch (error) {
    log.error("x-scraper:db", "Error getting all X accounts:", error);
    return [];
  }
};

/**
 * Xアカウントを保存
 */
export const saveXAccount = async (account: XAccountInsert): Promise<void> => {
  try {
    if (account.id) {
      await xAccountRepository.update(account.id, {
        ...account,
        updatedAt: new Date(),
      });
    } else {
      await xAccountRepository.create({
        ...account,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    log.info("x-scraper:db", `Saved X account: ${account.id}`);
  } catch (error) {
    log.error("x-scraper:db", `Error saving X account ${account.id}:`, error);
    throw error;
  }
};

/**
 * ツイートを保存し、アカウントの最新ツイートIDを更新
 */
export const saveTweets = async (accountId: string, tweets: Tweet[]): Promise<string | null> => {
  try {
    if (!tweets.length) {
      return null;
    }

    // 最新のツイートから保存
    let latestTweetId = null;

    for (const tweet of tweets) {
      const newTweet = await tweetRepository.create({
        authorId: accountId,
        url: tweet.url,
        content: tweet.data,
        tweetTime: new Date(tweet.time),
      });
      log.info("x-scraper:db", `Saved tweet: ${newTweet.id}`);

      // 最初のツイート（最新）のIDを記録
      if (!latestTweetId) {
        latestTweetId = newTweet.id;
      }
    }

    // アカウントの最新ツイートIDを更新
    if (latestTweetId) {
      await xAccountRepository.updateLastTweetId(accountId, latestTweetId);
      log.info("x-scraper:db", `Updated latest tweet ID for account ${accountId}: ${latestTweetId}`);
    }

    return latestTweetId;
  } catch (error) {
    log.error("x-scraper:db", `Error saving tweets for account ${accountId}:`, error);
    return null;
  }
};
