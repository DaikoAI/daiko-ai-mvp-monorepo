import { db } from "@daiko-ai/shared";
import { tokenPricesTable, tweetTable, userBalancesTable, usersTable, signalsTable } from "@daiko-ai/shared";
import { gte, desc, eq } from "drizzle-orm";
import { proposalGeneratorState } from "../utils/state";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

export const dataFetchNode = async (state: typeof proposalGeneratorState.State, options: LangGraphRunnableConfig) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // シグナルに関連するデータをDBから取得
  const [user, signal, tokenPrices, tweets, userBalance] = await Promise.all([
    db.query.usersTable.findFirst({
      where: eq(usersTable.id, options.configurable?.userId),
    }),

    db.query.signalsTable.findFirst({
      where: eq(signalsTable.id, options.configurable?.signalId),
    }),

    // 市場データ取得 (直近5分)
    db.query.tokenPricesTable.findMany({
      where: gte(tokenPricesTable.lastUpdated, fiveMinutesAgo),
      orderBy: [desc(tokenPricesTable.lastUpdated)],
      limit: 10,
    }),

    // 関連ツイート取得 (直近5分)
    db.query.tweetTable.findMany({
      where: gte(tweetTable.tweetTime, fiveMinutesAgo),
      orderBy: [desc(tweetTable.tweetTime)],
      limit: 20,
    }),

    // ユーザーポートフォリオ取得 (直近5分)
    db.query.userBalancesTable.findMany({
      where: eq(userBalancesTable.userId, options.configurable?.userId),
    }),
  ]);

  return {
    user,
    signal,
    tokenPrices,
    latestTweets: tweets,
    userBalance,
  };
};
