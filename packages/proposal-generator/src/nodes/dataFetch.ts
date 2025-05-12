import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { fetchSignal, fetchTokenPrices, fetchTweets, fetchUser, fetchUserBalances } from "../utils/db";
import { proposalGeneratorState } from "../utils/state";
export const dataFetchNode = async (state: typeof proposalGeneratorState.State, options: LangGraphRunnableConfig) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // シグナルに関連するデータをDBから取得
  const [user, signal, tokenPrices, tweets, userBalance] = await Promise.all([
    fetchUser(options.configurable?.userId),

    fetchSignal(options.configurable?.signalId),

    // 市場データ取得 (直近5分)
    fetchTokenPrices(fiveMinutesAgo),

    // 関連ツイート取得 (直近5分)
    fetchTweets(fiveMinutesAgo),

    // ユーザーポートフォリオ取得 (直近5分)
    fetchUserBalances(options.configurable?.userId),
  ]);

  return {
    user,
    signal,
    tokenPrices,
    latestTweets: tweets,
    userBalance,
  };
};
