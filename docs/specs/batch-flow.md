# バックエンド仕様書

## アーキテクチャ

```mermaid
graph TD
    %% --- Runtimes Definition ---
    subgraph VercelCron ["<strong>fa:fa-calendar-alt Vercel Cron Scheduler</strong>"]
        Cron_TwitterScrape["fa:fa-clock Schedule: Twitter Scrape (5m)"]
        Cron_NewsCrawl["fa:fa-clock Schedule: News Crawl (5m)"]
        Cron_MarketData["fa:fa-clock Schedule: Market Data (10m)"]
    end

    subgraph VercelFunctions ["<strong>fa:fa-server Vercel Functions</strong>"]
        Y_MarketDataFunc["fa:fa-chart-line <strong>Market Data Fetcher</strong> (CoinGecko)"]
        H_SignalProcessingFunc["fa:fa-cogs <strong>Signal Processing</strong> Func"]
        Q_ProposalGenerationFunc["fa:fa-lightbulb <strong>Proposal Generation</strong> Func"]
        X1_NotificationFunc["fa:fa-paper-plane <strong>Notification</strong> Func"]
    end

    subgraph Railway ["<strong>fa:fa-train Railway Server</strong>"]
        Service_TwitterScraper["fa:fa-twitter <strong>Twitter Scraper</strong> (Selenium)"]
        Service_NewsCrawler["fa:fa-newspaper <strong>News Crawler</strong>"]
    end

    subgraph OpenAI ["<strong>fa:fa-brain OpenAI API</strong>"]
        S_OpenAICall["OpenAI API Call"]
    end

    subgraph NeonDB ["<strong>fa:fa-database NeonDB Database</strong>"]
        DB_Tweets["Tweets Storage"]
        DB_News["News Storage"]
        DB_MarketData["Market Data Storage"]
        DB_Signals["Signals Storage"]
        DB_Proposals["Proposals Storage"]
        DB_UserData["User Data Access"]
    end

    subgraph Inngest ["<strong>fa:fa-exchange-alt Inngest</strong>"]
        ING_SignalDataQueue["fa:fa-tasks Queue: Source Data Updated"]
        ING_ProposalQueue["fa:fa-tasks Queue: signal.detected"]
        ING_NotifyQueue["fa:fa-tasks Queue: proposal.created"]
        ING_TweetEvent["fa:fa-bolt Event: tweet.updated"]
        ING_NewsEvent["fa:fa-bolt Event: news.updated"]
        ING_SignalEvent["fa:fa-bolt Event: signal.detected"]
        ING_ProposalEvent["fa:fa-bolt Event: proposal.created"]
    end

    %% --- Flows ---

    %% Twitter Scraping Flow
    Cron_TwitterScrape --> Service_TwitterScraper
    Service_TwitterScraper --> DB_Tweets
    DB_Tweets --"tweet.updated"--> ING_TweetEvent
    ING_TweetEvent --> ING_SignalDataQueue

    %% News Crawling Flow
    Cron_NewsCrawl --> Service_NewsCrawler
    Service_NewsCrawler --> DB_News
    DB_News --"news.updated"--> ING_NewsEvent
    ING_NewsEvent --> ING_SignalDataQueue

    %% Market Data Update Flow
    Cron_MarketData --> Y_MarketDataFunc
    Y_MarketDataFunc --> DB_MarketData

    %% Signal Detection Flow
    ING_SignalDataQueue --> H_SignalProcessingFunc
    H_SignalProcessingFunc --> DB_MarketData
    H_SignalProcessingFunc --> DB_Tweets
    H_SignalProcessingFunc --> DB_News
    H_SignalProcessingFunc --> DB_Signals
    DB_Signals --> H_SignalProcessingFunc
    H_SignalProcessingFunc -- "signal.detected" --> ING_SignalEvent
    ING_SignalEvent --> ING_ProposalQueue

    %% Proposal Generation Flow
    ING_ProposalQueue --> Q_ProposalGenerationFunc
    Q_ProposalGenerationFunc --> DB_Signals
    Q_ProposalGenerationFunc --> DB_UserData
    Q_ProposalGenerationFunc --> S_OpenAICall
    S_OpenAICall --> Q_ProposalGenerationFunc
    Q_ProposalGenerationFunc --> DB_Proposals
    DB_Proposals -- "proposal.created" --> ING_ProposalEvent

    %% Notification Flow
    ING_ProposalEvent --> ING_NotifyQueue
    ING_NotifyQueue --> X1_NotificationFunc
    X1_NotificationFunc --> SendNotify["fa:fa-envelope Send User Notification"]

    %% --- Styling (Dark Mode Friendly) ---
    classDef VercelCron fill:#A07ACC,stroke:#D8BFD8,color:#fff;
    classDef VercelFunctions fill:#6495ED,stroke:#ADD8E6,color:#fff;
    classDef Railway fill:#E9967A,stroke:#FFA07A,color:#000;
    classDef OpenAI fill:#40E0D0,stroke:#AFEEEE,color:#000;
    classDef NeonDB fill:#3CB371,stroke:#90EE90,color:#fff;
    classDef Inngest fill:#DAA520,stroke:#FFD700,color:#000;
    classDef Queue fill:#aaa,stroke:#ccc,color:#000,stroke-dasharray: 5 5;
    classDef Event fill:#fff,stroke:#FF6347,color:#FF6347;

    class VercelCron VercelCron;
    class VercelFunctions VercelFunctions;
    class Railway Railway;
    class OpenAI OpenAI;
    class NeonDB NeonDB;
    class Inngest Inngest;
    class ING_SignalDataQueue,ING_ProposalQueue,ING_NotifyQueue Queue;
    class ING_TweetEvent,ING_NewsEvent,ING_SignalEvent,ING_ProposalEvent Event;
```

## Vercel Cron Schedulers

### 目的

定期的なバッチ処理（データ収集）をトリガーします。

### 詳細

| ジョブ名           | スケジュール | ターゲット                                     | 目的                                         |
| :----------------- | :----------- | :--------------------------------------------- | :------------------------------------------- |
| Twitter Scrape Job | 5分ごと      | Railway: Twitter Scraper Service               | 定期的にTwitterから関連ツイートを取得する    |
| News Crawl Job     | 5分ごと      | Railway: News Crawler Service                  | 定期的に主要ニュースサイトから記事を取得する |
| Market Data Job    | 10分ごと     | Vercel Functions: Market Data Fetcher Function | 主要トークンの市場価格データを取得・更新する |

### 実装

- VercelのCron Job機能 (`vercel.json`) を使用して設定します。
- 各ジョブは対応するサービスのHTTPエンドポイントを呼び出すか、特定のイベントを発行して処理を開始させます。

---

## Railway Services (Data Acquisition)

### 1. Twitter Scraper Service

#### 目的

Vercel Cronからのトリガーを受け、Selenium Gridを使用してTwitterから特定のキーワードやアカウントに関連するツイートを取得し、NeonDBに保存します。

#### トリガー

- Vercel Cron (5分ごと) によるHTTPリクエスト or イベント

#### 技術スタック

- Node.js / TypeScript
- Selenium WebDriver (or Playwright)
- `pnpm` (Monorepo管理)
- NeonDB (`drizzle-orm`)

#### 処理フロー

1. Cronからのトリガーを受け取る。
2. 設定されたキーワードやアカウントリストに基づき、検索クエリを生成する。
3. Selenium Grid (Railway上の別サービス or 外部サービス) を利用してTwitterにアクセスし、検索を実行する。
4. 取得したツイートデータ（本文、投稿者、投稿日時、エンゲージメント数など）を整形する。
5. `drizzle-orm` を使用して、NeonDBの `tweets` テーブルに新しいツイートを挿入する (重複は避ける)。
6. 処理完了後、Inngestに `tweet.updated` イベントを送信する。

#### データスキーマ (NeonDB: `tweets`)

※詳細なテーブル定義は `packages/shared/src/schema` 以下の `tweets.ts` を参照してください。

#### エラーハンドリング

- Selenium操作中のエラー（要素が見つからない、ログイン失敗など）を捕捉し、リトライ処理やログ記録を行う。
- DB保存時のエラー（接続エラー、一意制約違反など）を適切に処理する。

### 2. News Crawler Service

#### 目的

Vercel Cronからのトリガーを受け、指定されたニュースサイトをクロールし、新しい記事を取得してNeonDBに保存します。

#### トリガー

- Vercel Cron (5分ごと) によるHTTPリクエスト or イベント

#### 技術スタック

- Node.js / TypeScript
- HTTP Client (e.g., `axios`, `node-fetch`)
- HTML Parser (e.g., `cheerio`)
- `pnpm` (Monorepo管理)
- NeonDB (`drizzle-orm`)

#### 処理フロー

1. Cronからのトリガーを受け取る。
2. 設定されたニュースサイトのURLリストを読み込む。
3. 各サイトにHTTPリクエストを送信し、HTMLコンテンツを取得する。
4. `cheerio` 等を使用してHTMLをパースし、記事のタイトル、URL、本文（要約）、公開日時などを抽出する。
5. 抽出した記事データを整形する。
6. `drizzle-orm` を使用して、NeonDBの `news` テーブルに新しい記事を挿入する (重複は避ける)。
7. 処理完了後、Inngestに `news.updated` イベントを送信する。

#### データスキーマ (NeonDB: `news`)

※詳細なテーブル定義は `packages/shared/src/schema` 以下の `news.ts` を参照してください。

#### エラーハンドリング

- HTTPリクエストのエラー（タイムアウト、404/500エラーなど）を捕捉し、リトライやログ記録を行う。
- HTMLパース時のエラー（構造変更による要素取得失敗など）を適切に処理する。
- DB保存時のエラーを処理する。

---

## Inngest とは？

### 役割

- 実行ランタイムではなく **イベント駆動ワークフロー＆ジョブキュー SaaS**
- Inngest Cloud はイベント管理とリトライ・スケジューリングを担い、実際のコードは Next.js／Vercel Functions など既存ランタイムで実行される

### 採用メリット

| 機能カテゴリ     | Inngest が担保                                     | 自前実装した場合                    |
| ---------------- | -------------------------------------------------- | ----------------------------------- |
| 配信保証         | at-least-once 配信、指数バックオフ付き自動リトライ | LISTEN/NOTIFY + 手動リトライ実装    |
| 冪等性           | `step.idempotencyKey()` 1 行で重複排除             | DB ユニーク制約＋排他ロック         |
| 並列度制御       | `concurrency.limit` で簡単設定                     | Redis レートリミタ等を構築          |
| 可観測性         | Web ダッシュボードでイベント／ステップを視覚化     | CloudWatch / Grafana などを別途構築 |
| スケジューリング | `inngest.cron()` でコード内に Cron 設定            | 外部 Cron + HTTP 呼び出し           |

### 実装フロー (Next.js の例)

1. クリティカルパス終了後に `inngest.send({ name: "tweet.updated", data: {...} })` を呼ぶ
2. `inngest.createFunction({ id: "detect-signal" }, { event: "tweet.updated" }, async ({ event }) => { ... })` でハンドラを定義
3. `serve()` を API Route (`/api/inngest`) に配置 → Inngest Cloud が署名付き HTTP で呼び出す

### 採用判断の指針

- ステップが複数、外部 API 失敗が多い、並列制御が必要など **複雑化が見込まれる場合** → Inngest を採用
- 少量トラフィックで単発処理のみの場合 → Phase1: LISTEN/NOTIFY + 単一 Worker で開始し、負荷増大時に Inngest へ移行

> 詳細な背景や判断基準は README も参照してください。

---

## Vercel Functions (Data Acquisition)

### Market Data Fetcher Function

#### 目的

Vercel Cronからのトリガーを受け、CoinGecko APIなどから主要な仮想通貨の市場価格データを取得し、NeonDBに保存・更新します。

#### トリガー

- Vercel Cron (10分ごと)

#### 技術スタック

- Node.js / TypeScript (Vercel Serverless Function)
- HTTP Client (e.g., `axios`, `node-fetch`)
- `pnpm` (Monorepo管理)
- NeonDB (`drizzle-orm`)

#### 処理フロー

1. Cronからのトリガーを受け取る。
2. 監視対象のトークンリスト（例: BTC, ETH, SOL...）を定義またはDBから取得する。
3. CoinGecko API (または他のデータソース)のエンドポイントを呼び出し、対象トークンの最新価格、出来高、時価総額などを取得する。
4. 取得したデータを整形する。
5. `drizzle-orm` を使用して、NeonDBの `market_data` テーブルに価格情報を挿入または更新する (`UPSERT` 処理)。
6. (オプション) Inngestに `market_data.updated` イベントを送信することも可能（シグナル検出でリアルタイム性が必要な場合）。

#### データスキーマ (NeonDB: `market_data`)

※詳細なテーブル定義は `packages/shared/src/schema` 以下の `market_data.ts` を参照してください。

#### エラーハンドリング

- API呼び出し時のエラー（レートリミット、APIキーエラー、ネットワークエラーなど）を捕捉し、リトライやログ記録を行う。
- データ整形時のエラー（予期しないレスポンス形式など）を処理する。
- DB保存/更新時のエラーを処理する。
