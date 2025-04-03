# Daiko AI MVP Monorepo

## 概要

Daiko AIは、暗号資産トレーダーのためのAIパワードトレーディングアシスタントです。ソーシャルメディア、ニュース、オンチェーンデータを統合し、高度な分析と取引提案を提供します。

## 主な機能

- リアルタイムのマーケットデータ監視
- ソーシャルメディア（X、Farcaster）の感情分析
- ニュースサイトからの情報収集
- オンチェーンデータの分析
- AIによる取引提案生成
- ユーザーポートフォリオのパフォーマンス追跡

## 技術スタック

- **フロントエンド**:

  - Next.js 15
  - React 19
  - TypeScript
  - Tailwind CSS 4
  - Radix UI
  - Solana Wallet Adapter
  - Firebase クライアント
  - Serwist (PWA)

- **バックエンド**:

  - TypeScript
  - Node.js
  - Hono
  - Firebase Admin

- **データベース**:

  - Firebase Firestore

- **インフラ**:
  - Turborepo (モノレポ管理)
  - pnpm (パッケージマネージャー)

## プロジェクト構成

```zsh
.
├── README.md
├── package.json
├── turbo.json
├── pnpm-workspace.yaml
├── apps
│   ├── news-scraper-job      # ニュースサイトスクレイパージョブ
│   ├── web                  # メインのウェブアプリケーション (Next.js)
│   │   ├── src
│   │   ├── public
│   │   └── package.json
│   └── x-scraper-job        # Xスクレイパージョブ
├── packages
│   ├── shared               # 共有コード、型定義、ユーティリティ
│   │   ├── src
│   │   └── package.json
│   ├── news-scraper         # ニュースサイトスクレイパー
│   │   ├── src
│   │   └── package.json
│   └── x-scraper            # X (Twitter) スクレイパー
│       ├── src
│       └── package.json
└── scripts
    └── clean-packages.sh    # ビルドファイルのクリーンアップ
```

## アーキテクチャ

### 全体アーキテクチャ

```mermaid
flowchart TB
    %% Batch Jobs Group
    subgraph "Batch Jobs"
        direction TB
        TS["X (Twitter) Scraper<br>(every 15 minutes)"]
        FS["Farcaster Scraper<br>(every 15 minutes)"]
        NS["News Site Scraper<br>(every 30 minutes)"]
        GM["Global Market Data<br>(every 5 minutes)"]
        OS["onchain-subscriber<br>(continuous)"]
        DP["Data Processing Pipeline"]

        TS & FS & NS --> DP
        GM --> DP
        OS --> DP
    end

    %% Firebase Group
    subgraph "Firebase"
        direction TB
        TP["Token Prices<br>(token_prices)"]
        SPT["Social Posts<br>(social_posts)"]
        NAT["News Articles<br>(news_articles)"]
        UPP["User Portfolio Performance<br>(user_portfolio_performance)"]
        UP["User Profiles<br>(users)"]
        WA["Watched Accounts<br>(user_watched_accounts)"]
        TK["Token Info<br>(tokens)"]
        TPR["Trade Proposals<br>(trade_proposals)"]
    end

    %% Server Group
    subgraph "Server"
        direction TB

        %% Trigger & Scheduler Subgroup
        subgraph "Trigger & Scheduler"
            TDE["Trigger Detection Engine"]
            SCH["Scheduler"]
            TDE --> TSQ["Trigger Queue"]
            SCH --> SPQ["Schedule Queue"]
        end

        %% Langgraph Subgroup with Two Phases
        subgraph "Langgraph"
            direction TB
            %% Data Fetch Phase
            subgraph "Data Fetch Phase"
                DFM["Data Fetch Module"]
            end
            %% Proposal Generation Phase
            subgraph "Proposal Generation Phase"
                CCDM["Crypto Domain Model"]
                PGM["Proposal Generation Module"]
            end
            %% Connect Data Fetch to Proposal Generation
            DFM --> CCDM
            CCDM --> PGM
        end

        %% Notification & API Subgroup
        subgraph "Notification & API"
            PG["Proposal Generation Process"]
            PDB["Proposal Database"]
            WPS["Web Push Service"]
            API["REST/GraphQL API"]

            PGM --> PG
            PG --> PDB
            PDB --> WPS
            PDB --> API
        end

        %% Connecting Trigger & Scheduler to Langgraph
        TSQ & SPQ --> DFM
    end

    %% Frontend Group
    subgraph "Frontend (Next.js)"
        API --> FE["Next.js Application"]
        WPS --> PN["Push Notification Receiver"]
        PN --> FE
        FE --> WC["Wallet Connection"]
        FE --> PD["Proposal Dashboard"]
        FE --> PFB["User Feedback"]
        PFB --> PG
    end

    %% Data Flow Between Major Components
    DP --> TP & SPT & NAT & UP & WA & TK
    OS --> TK
    %% Langgraph Data Fetch receives latest onchain and Firebase data:
    OS ---|Latest Onchain Portfolio| DFM
    UP ---|User Portfolio Data| DFM
    TP & SPT & NAT & UPP & WA ---|Additional Firebase Data| DFM

    %% Existing Flow for Trade Proposals
    PG --> TPR

    %% Styling Definitions
    classDef batchNode fill:#8E44AD,stroke:#2C3E50,stroke-width:2px,color:white;
    classDef dataNode fill:#3498DB,stroke:#2C3E50,stroke-width:2px,color:white;
    classDef serverNode fill:#1ABC9C,stroke:#2C3E50,stroke-width:2px,color:white;
    classDef frontendNode fill:#F39C12,stroke:#2C3E50,stroke-width:2px,color:white;

    %% Component Color Coding
    class TS,FS,NS,GM,OS,DP batchNode
    class TP,SPT,NAT,UPP,UP,WA,TK,TPR dataNode
    class TDE,SCH,TSQ,SPQ,DFM,CCDM,PGM,PG,PDB,WPS,API serverNode
    class FE,PN,WC,PD,PFB frontendNode
```

### Agent Architecture

![Agent Architecture](./docs/graph.png)

## セットアップ手順

### 前提条件

- Node.js 20以上
- pnpm 10.6.3以上
- Firebase CLIツール

### 開発環境のセットアップ

1. リポジトリのクローン

```bash
git clone https://github.com/your-org/daiko-ai-mvp-monorepo.git
cd daiko-ai-mvp-monorepo
```

2. 依存関係のインストール

```bash
pnpm install
```

3. 環境変数の設定

```bash
# webアプリ用
cp apps/web/.env.example apps/web/.env
# 必要な環境変数を設定

# スクレイパー用
cp packages/news-scraper/.env.example packages/news-scraper/.env
# 必要な環境変数を設定
```

4. 開発サーバーの起動

```bash
# フロントエンド
pnpm dev:web

# X (Twitter) スクレイパー
pnpm dev:x-scraper

# ニューススクレイパー
pnpm dev:news-scraper
```

## データベース操作 (Drizzle ORM + Neon Postgres)

このプロジェクトでは、データベースアクセスに [Drizzle ORM](https://orm.drizzle.team) と [Neon Postgres](https://neon.tech) を使用しています。データベーススキーマと共通クエリは `packages/shared` パッケージで一元管理されています。

### セットアップ

1. `.env` ファイルを作成し、Neon データベースの接続情報を設定:

```
DATABASE_URL=postgres://username:password@ep-xxx-xxx-xxx.region.aws.neon.tech/neondb
```

2. 必要なパッケージをインストール:

```bash
pnpm add -F @daiko-ai/shared @neondatabase/serverless dotenv drizzle-orm
pnpm add -D drizzle-kit
```

### スキーマ定義

スキーマは `packages/shared/src/db/schema` ディレクトリに定義されています。新しいテーブルを追加する場合は、このディレクトリに新しいファイルを作成し、`index.ts` からエクスポートしてください。

```typescript
// packages/shared/src/db/schema/example.ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const exampleTable = pgTable("example_table", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Example = typeof exampleTable.$inferSelect;
export type NewExample = typeof exampleTable.$inferInsert;
```

### マイグレーション

#### マイグレーションファイルの生成

スキーマの変更を行った後、以下のコマンドでマイグレーションファイルを生成します：

```bash
pnpm db:generate
```

生成されたマイグレーションファイルは `migrations` ディレクトリに保存されます。

#### データベースへの反映

マイグレーションをデータベースに適用するには、以下のコマンドを実行します：

```bash
# マイグレーションファイルを使用してDBを更新
pnpm run -F @daiko-ai/shared migrate

# または直接スキーマを反映（開発時のみ推奨）
pnpm db:push
```

### データベース操作

#### 接続

`packages/shared/src/db/connection.ts` からデータベース接続をインポートして使用します：

```typescript
import { db } from "@daiko-ai/shared/src/db/connection";
```

#### 共通クエリ

共通クエリ関数は `packages/shared/src/db/queries` に定義されています。

```typescript
import { getUserById, createUser } from "@daiko-ai/shared/src/db/queries/users";

// ユーザー取得
const user = await getUserById(1);

// ユーザー作成
await createUser({
  name: "ユーザー名",
  age: 30,
  email: "user@example.com",
});
```

#### カスタムクエリ

パッケージ固有のクエリロジックは、各パッケージ内で定義してください：

```typescript
import { db } from "@daiko-ai/shared/src/db/connection";
import { eq } from "drizzle-orm";
import { usersTable } from "@daiko-ai/shared/src/db/schema/users";

// カスタムクエリ
export async function findUsersByAge(age: number) {
  return db.select().from(usersTable).where(eq(usersTable.age, age));
}
```

### 開発ツール

Drizzle Studio を使ってデータベースを視覚的に操作できます：

```bash
pnpm db:studio
```

ブラウザで `http://localhost:4983` を開くと、テーブルやデータを確認・編集できます。

### 推奨プラクティス

1. **スキーマ設計**: アプリケーション全体で共通のスキーマを `shared` パッケージで管理
2. **クエリ分離**: 共通クエリは `shared` パッケージに、パッケージ固有のクエリは各パッケージに配置
3. **マイグレーション管理**: スキーマの変更は必ずマイグレーションを通して行う
4. **型安全性**: 常にDrizzleの型定義（`$inferSelect`、`$inferInsert`）を活用する
