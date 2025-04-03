import { NewsScraperDB } from "@daiko-ai/news-scraper";
import type { Tweet } from "@daiko-ai/shared";
import { getAllXAccounts } from "@daiko-ai/x-scraper";
import { RepositoryFactory } from "@daiko-ai/x-scraper/src/repositories/factory";

import { type proposalAgentState } from "../utils/state";

// RepositoryFactoryのインスタンスを取得
const repositoryFactory = RepositoryFactory.getInstance();
// TweetRepositoryを取得
const tweetRepository = repositoryFactory.getTweetRepository();

export const postgresNode = async (state: typeof proposalAgentState.State) => {
  try {
    // X (Twitter) アカウントを取得
    const xAccounts = await getAllXAccounts();

    // 各アカウントの最新ツイートを取得
    const tweetPromises = xAccounts.map(async (xAccount) => {
      if (!xAccount.id || !xAccount.lastTweetId) return null;

      // アカウントの最新ツイートを取得
      const latestTweet = await tweetRepository.findById(xAccount.lastTweetId);
      if (!latestTweet) return null;

      // Tweetの形式に変換
      return {
        time: latestTweet.tweetTime.toISOString(),
        data: latestTweet.content,
      } as Tweet;
    });

    // nullを除外
    const tweets = (await Promise.all(tweetPromises)).filter(Boolean) as Tweet[];

    console.log(tweets);

    // ニュースサイトを取得
    const newsScraperDB = new NewsScraperDB();
    const newsSites = await newsScraperDB.getNewsSites();

    console.log(newsSites);

    state.newsSites = newsSites;
    state.tweets = tweets;
  } catch (error) {
    console.error("Error fetching data from PostgreSQL:", error);
  }

  return state;
};
