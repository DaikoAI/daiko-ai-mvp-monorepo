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
 * ツイートを保存し、アカウントの最新ツイート更新日時を更新
 */
export const saveTweets = async (accountId: string, tweets: Tweet[]): Promise<Date | null> => {
  try {
    if (!tweets.length) {
      return null;
    }

    let newestTweetDate: Date | null = null;

    for (const tweet of tweets) {
      const tweetDate = new Date(tweet.time);
      const newTweet = await tweetRepository.create({
        authorId: accountId,
        url: tweet.url,
        retweetCount: tweet.retweetCount ?? 0,
        replyCount: tweet.replyCount ?? 0,
        likeCount: tweet.likeCount ?? 0,
        content: tweet.data,
        tweetTime: tweetDate,
      });
      log.info("x-scraper:db", `Saved tweet: ${newTweet.id}`);

      if (!newestTweetDate || tweetDate > newestTweetDate) {
        newestTweetDate = tweetDate;
      }
    }

    // アカウントの最新ツイート更新日時を更新
    if (newestTweetDate) {
      await xAccountRepository.updateLastTweetUpdatedAt(accountId, newestTweetDate);
      log.info(
        "x-scraper:db",
        `Updated lastTweetUpdatedAt for account ${accountId} to: ${newestTweetDate.toISOString()}`,
      );
    }

    return newestTweetDate;
  } catch (error) {
    log.error("x-scraper:db", `Error saving tweets for account ${accountId}:`, error);
    return null;
  }
};
