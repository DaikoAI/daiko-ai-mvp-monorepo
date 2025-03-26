import { z } from "zod";

// ニュース記事の型定義
export interface NewsSite {
  id?: string;
  url: string;
  userId: string;
  lastCrawled?: string;
  title?: string;
  description?: string;
}

export interface ScrapeResult {
  id: string;
  siteId: string;
  url: string;
  content: string;
  timestamp: string;
}

// ユーザープロファイル型定義
export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  interests: z.array(z.string()).optional(),
  preferredCategories: z.array(z.string()).optional(),
  preferredSources: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// コレクション名の定数
export const COLLECTIONS = {
  NEWS: "news",
  TWEETS: "tweets",
  USER_PROFILES: "userProfiles",
  SCRAPE_RESULTS: "scrapeResults",
  X_ACCOUNTS: "xAccounts",
  CHANGE_LOGS: "changeLogs",
  NOTIFICATION_LOGS: "notificationLogs",
  CRYPTO_ANALYSES: "cryptoAnalyses",
} as const;

export type CollectionName = (typeof COLLECTIONS)[keyof typeof COLLECTIONS];

export interface XAccount {
  id: string;
  lastContent?: Tweet[];
  userIds?: string[];
}

export interface Tweet {
  time: string;
  data: string;
}

export interface ChangeLog {
  timestamp: string;
  xid: string;
  content: Tweet[];
}

export interface NotificationLog {
  timestamp: string;
  accountId: string;
  notifiedUsers: string[];
  message: string;
}

export interface AppConfig {
  port: number;
  openAiApiKey: string;
  checkIntervalMinutes: number;
  nodeEnv: string;
  firebaseDatabaseUrl: string;
}

export interface CryptoAnalysis {
  isCryptoRelated: boolean;
  analysisResult: string;
}
