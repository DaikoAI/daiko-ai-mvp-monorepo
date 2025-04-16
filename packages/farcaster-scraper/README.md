# @daiko-ai/farcaster-scraper

Farcasterの特定アカウント・キーワード監視用スクレイピングサービス

---

## 概要

- **Farcasterの特定アカウントの最新cast・プロフィール情報を定期取得しDBに保存**
- **キーワードごとにNeynar APIでcast検索し、結果をDBに保存**
- **情報の鮮度・監視対象の柔軟な管理が可能**
- **NeonDB(PostgreSQL) + drizzle-ormで高速・型安全なデータ管理**

---

## 主な機能

- 監視アカウント（FID/username指定）の最新cast・プロフィール取得
- キーワードごとの最新cast検索・保存
- 監視対象・キーワードの追加/削除・有効化/無効化
- レートリミット・APIエラー時の自動リトライ
- cast/ユーザー情報の鮮度管理

---

## DBスキーマ（主要テーブル）

- `farcaster_users`
  - fid, username, ...
  - `lastFetchedAt`（最新情報取得日時）
  - `isMonitored`（監視対象フラグ）
- `farcaster_casts`
  - hash, authorFid, ...
  - `fetchedAt`（取得日時）
  - `isLatest`（監視アカウントの最新castフラグ）
- `farcaster_keywords`
  - keyword, isActive, lastScannedAt

---

## 使い方

### 1. 依存パッケージのインストール

```sh
pnpm install
```

### 2. 環境変数

- `NEYNAR_API_KEY` : NeynarのAPIキー
- `DATABASE_URL` : PostgreSQL接続URL

### 3. 主要API/関数

```ts
import { scrapeActiveKeywords, scrapeMonitoredAccounts, addMonitoredAccount } from "@daiko-ai/farcaster-scraper";

// キーワード監視バッチ
await scrapeActiveKeywords();

// 監視アカウントのcast・プロフィール取得バッチ
await scrapeMonitoredAccounts();

// 監視アカウント追加
await addMonitoredAccount({ fid: 12345 });
```

---

## レートリミット・運用上の注意

- Neynar APIのStarterプラン: 300RPM/5RPS（APIごとに上限あり）
- 監視アカウント・キーワード数が多い場合は**バッチサイズ・間隔を調整**
- APIエラー時は指数バックオフで自動リトライ
- cast/ユーザー情報の鮮度は`lastFetchedAt`/`fetchedAt`で管理
- **DBのインデックス設計・バッチ設計で高頻度アクセスにも耐える設計**

---

## 今後の拡張例

- 監視アカウントの自動追加/削除API
- cast内容の全文検索・分析
- Webhook/通知連携
- 管理画面UI

---

## License

MIT

---

## Casts for a Specific Keyword (Drizzle ORM Query Example)

```ts
import { db, castKeywordsTable, farcasterCastsTable, farcasterKeywordsTable } from "@daiko-ai/shared";
import { eq } from "drizzle-orm";

// 例: "SOL" というキーワードに紐づくcast一覧を取得
const keyword = "SOL";

// 1. キーワードIDを取得
const [keywordRow] = await db
  .select({ id: farcasterKeywordsTable.id })
  .from(farcasterKeywordsTable)
  .where(eq(farcasterKeywordsTable.keyword, keyword));

if (keywordRow) {
  // 2. 中間テーブル経由でcastを取得
  const casts = await db
    .select()
    .from(castKeywordsTable)
    .leftJoin(farcasterCastsTable, eq(castKeywordsTable.castId, farcasterCastsTable.id))
    .where(eq(castKeywordsTable.keywordId, keywordRow.id));
  // casts配列の各要素にcast情報が含まれます
}
```

---
