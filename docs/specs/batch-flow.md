# バックエンド仕様書

## Data collection - Proposal Generation Flow

```mermaid
graph TD
    %% データ収集プロセス
    subgraph DataCollection["データ収集 (5分毎)"]
        A[Vercel Cron] --> B[スクレイピング関数]
        B --> C[Railway Selenium]
        C --> D[Twitter取得]
        D --> E[DB: ツイート保存]
        E --> F[更新イベント送信]
    end

    %% 市場データ更新
    subgraph MarketUpdate["市場データ更新 (10分毎)"]
        Z[Vercel Cron] --> Y[市場データ関数]
        Y --> X[DB: 20種トークン価格更新]
    end

    %% シグナル検出処理
    subgraph SignalProcess["シグナル検出処理"]
        F --> G[Inngest Queue]
        G --> H[シグナル検出関数]
        H --> I[DB: データ取得]
        I --> J[トークン別分析]
        J --> K1[インフルエンサー分析]
        J --> K2[価格パターン分析]
        J --> K3[オンチェーン分析]
        J --> K4[センチメント分析]
        K1 --> L[シグナルスコアリング]
        K2 --> L
        K3 --> L
        K4 --> L
        L --> M[DB: シグナル保存]
        M --> N[保有ユーザー特定]
        N --> O[signal.detected イベント]
    end

    %% 提案生成
    subgraph ProposalGen["提案生成プロセス"]
        O --> P[Inngest Queue]
        P --> Q[提案生成関数]
        Q --> R1[ユーザープロファイル]
        Q --> R2[ポートフォリオ構成]
        Q --> R3[過去取引パターン]
        R1 --> S[OpenAI API 呼び出し]
        R2 --> S
        R3 --> S
        S --> T[パーソナライズ提案]
        T --> U[DB: 提案保存]
        U --> V[proposal.created イベント]
    end

    %% 通知処理
    subgraph Notification["通知プロセス"]
        V --> W[Inngest Queue]
        W --> X1[通知関数]
        X1 --> Y1[ユーザー通知送信]
    end

    %% フロー接続
    DataCollection --> SignalProcess
    MarketUpdate -.-> SignalProcess
    SignalProcess --> ProposalGen
    ProposalGen --> Notification

    %% スタイル
    classDef collection fill:#e1d5e7,stroke:#333,stroke-width:1px;
    classDef market fill:#ffe6cc,stroke:#333,stroke-width:1px;
    classDef signal fill:#d5e8d4,stroke:#333,stroke-width:1px;
    classDef proposal fill:#fff2cc,stroke:#333,stroke-width:1px;
    classDef notify fill:#f8cecc,stroke:#333,stroke-width:1px;
    classDef queue fill:#f9f9f9,stroke:#999,stroke-width:2px,stroke-dasharray:5 5;

    class DataCollection collection;
    class MarketUpdate market;
    class SignalProcess signal;
    class ProposalGen proposal;
    class Notification notify;
    class G,P,W queue;
```
