# Daiko AI MVP Monorepo

## 概要

Daiko AIは、暗号資産トレーダーのためのAIパワードトレーディングアシスタントです。ソーシャルメディア、ニュース、オンチェーンデータを統合し、高度な分析と取引提案を提供します。

## 主な機能

- リアルタイムのマーケットデータ監視
- ソーシャルメディア（Twitter、Farcaster）の感情分析
- ニュースサイトからの情報収集
- オンチェーンデータの分析
- AIによる取引提案生成
- ユーザーポートフォリオのパフォーマンス追跡

## 技術スタック

- **フロントエンド**: Next.js
- **バックエンド**: Python (FastAPI)
- **データベース**: Firebase
- **AI/ML**: LangGraph
- **インフラ**: Cloud Run, Cloud Functions

## セットアップ手順

### 前提条件

- Node.js 18以上
- Python 3.10以上
- Firebase CLIツール
- Google Cloud SDKツール

### 開発環境のセットアップ

1. リポジトリのクローン

```bash
git clone https://github.com/your-org/daiko-ai-mvp-monorepo.git
cd daiko-ai-mvp-monorepo
```

2. 環境変数の設定

```bash
cp .env.example .env
# .envファイルを編集して必要な環境変数を設定
```

3. フロントエンドのセットアップ

```bash
cd frontend
npm install
npm run dev
```

4. バックエンドのセットアップ

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## アーキテクチャ

```mermaid
flowchart TB
    %% Batch Jobs Group
    subgraph "Batch Jobs"
        direction TB
        TS["Twitter Scraper<br>(every 15 minutes)"]
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

## プロジェクト構成

```bash
.
├── README.md
├── apps
│   └── web
├── package.json
├── packages
│   ├── news-scraper
│   ├── shared
│   └── x-scraper
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── scripts
│   └── clean-packages.sh
└── turbo.json
```
