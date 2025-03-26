/**
 * schema.ts
 *
 * Firestoreコレクションのドキュメント構造をZodスキーマとして定義し、
 * それに基づくTypeScript型を生成しています。
 *
 * プロジェクトにZodをインストールした上でご利用ください:
 *   npm install zod
 * または
 *   pnpm add zod
 */

import { z } from "zod";

export const newsSiteSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  userId: z.string(),
  lastCrawled: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});
export type NewsSite = z.infer<typeof newsSiteSchema>;

export const scrapeResultSchema = z.object({
  id: z.string(),
  siteId: z.string(),
  url: z.string(),
  content: z.string(),
  timestamp: z.string(),
});
export type ScrapeResult = z.infer<typeof scrapeResultSchema>;

export const userSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().optional(),
  walletAddress: z.string(),
  // MVP ではTimestampを文字列で扱うか、z.date()にするかは運用次第。
  // FirestoreのTimestamp型を厳密に表すなら z.any() を使う方法もあります。
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),

  // 監視アカウントをシンプルに配列で持つパターン
  watchedAccounts: z.array(z.string()).optional(),
});
export type User = z.infer<typeof userSchema>;

export const tradeProposalSchema = z.object({
  // triggerEvents/{triggerId} のID
  triggerEventId: z.string().optional(),

  // 個別ユーザー向けの場合
  userId: z.string().optional(),

  // 以下、フロントエンドProposal型に基づく追加フィールド
  title: z.string(),
  summary: z.string(),
  reason: z.array(z.string()),
  sources: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
    }),
  ),
  type: z.enum(["trade", "stake", "risk", "opportunity"]).optional(),
  proposedBy: z.string().optional(),
  financialImpact: z
    .object({
      currentValue: z.number(),
      projectedValue: z.number(),
      percentChange: z.number(),
      timeFrame: z.string(),
      riskLevel: z.enum(["low", "medium", "high"]),
    })
    .optional(),
  expires_at: z.string().optional(),
  recommendedAction: z.string(), // "BUY", "SELL", "HOLD"など
  status: z.string().optional(),
  // Solanaコントラクトコール用のパラメータをマップで持つ例
  contractCall: z.record(z.any()).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type TradeProposal = z.infer<typeof tradeProposalSchema>;

export const COLLECTIONS = {
  USER_PROFILES: "userProfiles",
  NEWS_SITES: "newsSites",
  SCRAPE_RESULTS: "scrapeResults",
  X_ACCOUNTS: "xAccounts",
  CHANGE_LOGS: "changeLogs",
  NOTIFICATION_LOGS: "notificationLogs",
  TRADE_PROPOSALS: "tradeProposals",
} as const;

// 以下、Zodスキーマによるバリデーション用の定義
export const collectionNameSchema = z.enum([
  COLLECTIONS.USER_PROFILES,
  COLLECTIONS.NEWS_SITES,
  COLLECTIONS.SCRAPE_RESULTS,
  COLLECTIONS.X_ACCOUNTS,
  COLLECTIONS.CHANGE_LOGS,
  COLLECTIONS.NOTIFICATION_LOGS,
  COLLECTIONS.TRADE_PROPOSALS,
]);
export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export const tweetSchema = z.object({
  time: z.string(),
  data: z.string(),
});
export type Tweet = z.infer<typeof tweetSchema>;

export const xAccountSchema = z.object({
  id: z.string(),
  lastContent: z.array(tweetSchema).optional(),
  userIds: z.array(z.string()).optional(),
});
export type XAccount = z.infer<typeof xAccountSchema>;

export const changeLogSchema = z.object({
  timestamp: z.string(),
  xid: z.string(),
  content: z.array(tweetSchema),
});
export type ChangeLog = z.infer<typeof changeLogSchema>;

export const notificationLogSchema = z.object({
  timestamp: z.string(),
  accountId: z.string(),
  notifiedUsers: z.array(z.string()),
  message: z.string(),
});
export type NotificationLog = z.infer<typeof notificationLogSchema>;

export const appConfigSchema = z.object({
  port: z.number(),
  openAiApiKey: z.string(),
  checkIntervalMinutes: z.number(),
  nodeEnv: z.string(),
  firebaseDatabaseUrl: z.string(),
});
export type AppConfig = z.infer<typeof appConfigSchema>;

export const cryptoAnalysisSchema = z.object({
  isCryptoRelated: z.boolean(),
  analysisResult: z.string(),
});
export type CryptoAnalysis = z.infer<typeof cryptoAnalysisSchema>;
