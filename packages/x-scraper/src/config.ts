import dotenv from "dotenv";
import { AppConfig } from "./types";

// .envファイルを読み込む
dotenv.config();

// 環境変数からアプリケーション設定を作成
export const config: AppConfig = {
  port: parseInt(process.env.PORT || "3000", 10),
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  firebaseDatabaseUrl: process.env.FIREBASE_DATABASE_URL || "",
  checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || "30", 10),
  nodeEnv: process.env.NODE_ENV || "development",
};

// 設定の検証
export const validateConfig = (): void => {
  if (!config.openAiApiKey) {
    throw new Error("OPENAI_API_KEY environment variable is required");
  }
  if (!config.firebaseDatabaseUrl) {
    throw new Error("FIREBASE_DATABASE_URL environment variable is required");
  }
};
