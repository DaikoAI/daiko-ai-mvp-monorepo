import { db } from "@daiko-ai/shared";
import { tokenPricesTable, tweetTable, newsSiteTable, portfolioSnapshots } from "@daiko-ai/shared";
import { and, eq, gte, desc } from "drizzle-orm";
import { proposalGeneratorState } from "../utils/state";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";

export const dataFetchNode = async (state: typeof proposalGeneratorState.State, options: LangGraphRunnableConfig) => {
  const threadId = options.configurable?.thread_id;
  if (!threadId) {
    throw new Error("thread_id is missing in config");
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  // シグナルに関連するデータをDBから取得
  const [marketData, tweets, news, portfolio] = await Promise.all([
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

    // 関連ニュース取得 (直近5分) - news_sites テーブルを代替として使用
    db.query.newsSiteTable.findMany({
      where: gte(newsSiteTable.updatedAt, fiveMinutesAgo),
      orderBy: [desc(newsSiteTable.updatedAt)],
      limit: 10,
    }),

    // ユーザーポートフォリオ取得 (直近5分)
    db.query.portfolioSnapshots.findFirst({
      where: and(eq(portfolioSnapshots.userId, threadId), gte(portfolioSnapshots.timestamp, fiveMinutesAgo)),
      orderBy: [desc(portfolioSnapshots.timestamp)],
    }),
  ]);

  return {
    dbData: {
      marketData,
      tweets,
      news,
      portfolio,
    },
    processingStage: "analysis",
  };
};
