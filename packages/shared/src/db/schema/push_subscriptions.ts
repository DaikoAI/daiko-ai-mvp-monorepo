import { relations } from "drizzle-orm";
import { index, pgTable, primaryKey, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

import { usersTable } from "./users"; // 既存のusersスキーマをインポート

/**
 * push_subscriptions テーブル
 * Web Push 通知の購読情報を保存します。
 * 各行は、特定のユーザーの特定のブラウザ/デバイスでの購読を表します。
 * プライマリーキー: (userId, endpoint)の組み合わせ
 * リレーション: users(1) - (n)push_subscriptions
 */
export const pushSubscriptionTable = pgTable(
  "push_subscriptions",
  {
    userId: varchar("user_id", { length: 255 })
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }), // ユーザーID (usersテーブルへのFK)
    endpoint: text("endpoint").notNull(), // プッシュサービスから提供される一意のエンドポイントURL
    p256dh: text("p256dh").notNull(), // 公開鍵 (Elliptic curve Diffie-Hellman P-256)
    auth: text("auth").notNull(), // 認証シークレット (Authentication secret)
    userAgent: text("user_agent"), // 購読時のブラウザUser Agent
    os: varchar("os", { length: 100 }), // 購読時のOS (例: 'iOS', 'Windows')
    browser: varchar("browser", { length: 100 }), // 購読時のブラウザ (例: 'Chrome', 'Safari')
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(), // 作成日時
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(), // 更新日時
  },
  (table) => [
    // userId と endpoint の組み合わせをプライマリーキーとして設定
    primaryKey({ columns: [table.userId, table.endpoint] }),
    // 特定ユーザーの購読を検索することが多いため、userIdにインデックスを追加
    index("push_subscription_user_idx").on(table.userId),
    // 同じユーザーが同じOS/ブラウザの組み合わせで重複購読しないようにする
    uniqueIndex("user_os_browser_unique_idx").on(table.userId, table.os, table.browser),
  ],
);

// usersテーブルとのリレーション定義
export const pushSubscriptionsRelations = relations(pushSubscriptionTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [pushSubscriptionTable.userId],
    references: [usersTable.id],
  }),
}));
