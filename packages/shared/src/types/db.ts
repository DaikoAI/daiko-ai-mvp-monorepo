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

/* ------------------------------------
 *  1. users コレクション
 *  パス: users/{userId}
 * ------------------------------------ */
export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  walletAddress: z.string().optional(),
  // MVP ではTimestampを文字列で扱うか、z.date()にするかは運用次第。
  // FirestoreのTimestamp型を厳密に表すなら z.any() を使う方法もあります。
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),

  // 監視アカウントをシンプルに配列で持つパターン
  watchedAccounts: z.array(z.string()).optional(),
});
export type User = z.infer<typeof userSchema>;

/* ------------------------------------
 *  2. tokens コレクション
 *  パス: tokens/{tokenId}
 * ------------------------------------ */
export const tokenSchema = z.object({
  symbol: z.string(), // 例: "SOL", "BTC"
  name: z.string().optional(), // トークン名称
  solanaMint: z.string().optional(),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Token = z.infer<typeof tokenSchema>;

/* ------------------------------------
 *  3. tokenPrices コレクション
 *  パス: tokenPrices/{docId}
 *  ( tokenId + timestamp ) などで一意化
 * ------------------------------------ */
export const tokenPriceSchema = z.object({
  tokenId: z.string(), // tokens/{tokenId}へのリファレンスID
  timestamp: z.string(), // 価格取得時点
  price: z.number(), // 現在価格
  volume: z.number().optional(), // 24h取引量等(あれば)
});
export type TokenPrice = z.infer<typeof tokenPriceSchema>;

/* ------------------------------------
 *  4. socialPosts コレクション
 *  パス: socialPosts/{postId}
 * ------------------------------------ */
export const socialPostSchema = z.object({
  platform: z.string(), // "twitter", "farcaster" など
  externalId: z.string(), // TwitterのTweetID等
  userHandle: z.string().optional(),
  content: z.string().optional(),
  sentiment: z.number().optional(), // -1.0～+1.0等
  relatedTokens: z.array(z.string()).optional(),

  postedAt: z.string().optional(), // 実際の投稿日時
  createdAt: z.string().optional(), // Firestore登録日時
});
export type SocialPost = z.infer<typeof socialPostSchema>;

/* ------------------------------------
 *  5. newsArticles コレクション
 *  パス: newsArticles/{articleId}
 * ------------------------------------ */
export const newsArticleSchema = z.object({
  source: z.string(), // ニュースサイト名など
  title: z.string(),
  url: z.string(),
  content: z.string().optional(),
  sentiment: z.number().optional(),
  relatedTokens: z.array(z.string()).optional(),

  publishedAt: z.string().optional(), // 実際の公開日時
  createdAt: z.string().optional(), // Firestore登録日時
});
export type NewsArticle = z.infer<typeof newsArticleSchema>;

/* ------------------------------------
 *  6. triggerEvents コレクション
 *  パス: triggerEvents/{triggerId}
 * ------------------------------------ */
export const triggerEventSchema = z.object({
  type: z.string(), // "NEWS", "TWITTER", "MARKET"など
  dataRef: z.record(z.any()).optional(),
  // ※ 例: { articleId: "xxx", postIds: ["yyy","zzz"] } など
  condition: z.string().optional(),

  createdAt: z.string().optional(),
});
export type TriggerEvent = z.infer<typeof triggerEventSchema>;

/* ------------------------------------
 *  7. tradeProposals コレクション
 *  パス: tradeProposals/{proposalId}
 * ------------------------------------ */
export const tradeProposalSchema = z.object({
  // triggerEvents/{triggerId} のID
  triggerEventId: z.string().optional(),

  // 個別ユーザー向けの場合
  userId: z.string().optional(),

  recommendedAction: z.string(), // "BUY", "SELL", "HOLD"など
  status: z.string().optional(), // "PENDING", "EXECUTED"など
  // Solanaコントラクトコール用のパラメータをマップで持つ例
  contractCall: z.record(z.any()).optional(),

  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type TradeProposal = z.infer<typeof tradeProposalSchema>;

/* ------------------------------------
 *  8. userPortfolioHistory (任意)
 *  パス: userPortfolioHistory/{docId}
 * ------------------------------------ */
export const userPortfolioHistorySchema = z.object({
  userId: z.string(),
  tokenSymbol: z.string(),
  balance: z.number(),
  usdValue: z.number().optional(),
  recordedAt: z.string().optional(), // 記録時刻
});
export type UserPortfolioHistory = z.infer<typeof userPortfolioHistorySchema>;

/*
 * 使用例:
 *  const docData: any = await getDoc(...);
 *  const parsed = userSchema.parse(docData);
 *  // parsed: User 型が保証される
 */
