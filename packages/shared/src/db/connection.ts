import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("connection.ts: DATABASE_URL is not set");
}

const sql = neon(process.env.DATABASE_URL);
// デフォルトのデータベース接続をエクスポート
export const db = drizzle(sql, { schema });
export type NeonHttpDatabase = typeof db;
