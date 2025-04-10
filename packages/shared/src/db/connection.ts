import { neon } from "@neondatabase/serverless";
import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
// デフォルトのデータベース接続をエクスポート
export const db = drizzle(sql, { schema });
export type NeonHttpDatabase = typeof db;
