# αテストシステム仕様書

## 1. 概要

本システムは、αテスト期間中にオフチェーン（DB）でcryptoアセットのトレード体験を再現し、AI Agentサービスの価値検証を行うための基盤となる。ユーザーは同一の初期ポートフォリオから始め、2週間の運用期間中に獲得したPnLを競い合う形式のコンペティションを実施する。

## 2. 使用技術

- **DB**: [NeonDB](https://neon.tech/) (PostgreSQL)
- **ORM**: [Drizzle](https://drizzle.dev/)
- **API**: Next.js API Routes with [tRPC](https://trpc.io/)
- **フロントエンド**: [Next.js](https://nextjs.org/)

## 3. 実装スケジュール

### Phase 1（初期リリース）

- 基本DB設計と実装
- トークン管理機能の実装
- ステーキング、1:1スワップ、Liquid Staking機能の実装
- ポートフォリオ表示と時価評価の基本機能実装
- 日次バッチ処理の設定

### Phase 2（1週間後）

- Perp Tradeの実装（成り行き注文、レバレッジ設定）
- Funding Rateの取得と適用ロジックの実装
- 清算処理の自動化と通知システム実装
- ポートフォリオ表示の拡張（Perp Trading含む全体PnL計算）

## 4. ユースケース

### 初期フェーズ（リリース時）

- ユーザーが自分のトークンをステーキングし、日次の利回りを獲得する
- トークンを1:1でスワップする
- ユーザーがトークンをLiquid Stake Poolにステークし、LSTを獲得。LSTは規定の利回りで価値が増加する

### 拡張フェーズ（1週間後）

- Perp Trade（レバレッジ付き、成り行き注文のみ）の実装
- Funding Rateの適用と日次調整
- ポジションの清算ロジックと処理の実装

## 5. データベース設計

### `users` テーブル

| カラム名              | データ型      | 制約                                                   | 説明                  |
| --------------------- | ------------- | ------------------------------------------------------ | --------------------- |
| id                    | UUID          | PRIMARY KEY                                            | ユーザーID            |
| username              | VARCHAR(255)  | NOT NULL                                               | ユーザー名            |
| email                 | VARCHAR(255)  | UNIQUE, **INDEX** `idx_users_email`                    | メールアドレス        |
| wallet_address        | VARCHAR(255)  | UNIQUE, NOT NULL, **INDEX** `idx_users_wallet_address` | ウォレットアドレス    |
| total_asset_usd       | DECIMAL(20,8) | DEFAULT 0                                              | 総資産額（USD）       |
| crypto_investment_usd | DECIMAL(20,8) | DEFAULT 0                                              | 仮想通貨投資額（USD） |
| trade_style           | VARCHAR(50)   |                                                        | トレードスタイル      |
| created_at            | TIMESTAMP     | NOT NULL, DEFAULT NOW                                  | 作成日時              |
| updated_at            | TIMESTAMP     | NOT NULL, DEFAULT NOW                                  | 更新日時              |

### `tokens` テーブル

| カラム名 | データ型     | 制約                                    | 説明                                                 |
| -------- | ------------ | --------------------------------------- | ---------------------------------------------------- |
| address  | VARCHAR(255) | PRIMARY KEY                             | コントラクトアドレス                                 |
| symbol   | VARCHAR(20)  | NOT NULL, **INDEX** `idx_tokens_symbol` | トークンシンボル                                     |
| name     | VARCHAR(255) | NOT NULL                                | トークン名                                           |
| decimals | INTEGER      | NOT NULL                                | 小数点以下の桁数                                     |
| icon_url | VARCHAR(512) |                                         | アイコンURL                                          |
| type     | VARCHAR(50)  | NOT NULL, **INDEX** `idx_tokens_type`   | トークンタイプ（normal/lending/perp/liquid_staking） |

### `user_balances` テーブル

| カラム名      | データ型     | 制約                                                                                                                                               | 説明             |
| ------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- |
| id            | UUID         | PRIMARY KEY                                                                                                                                        | ID               |
| user_id       | UUID         | NOT NULL, FOREIGN KEY REFERENCES users(id), **複合UNIQUE INDEX** `idx_user_balances_user_token`                                                    | ユーザーID       |
| token_address | VARCHAR(255) | NOT NULL, FOREIGN KEY REFERENCES tokens(address), **INDEX** `idx_user_balances_token_address`, **複合UNIQUE INDEX** `idx_user_balances_user_token` | トークンアドレス |
| balance       | VARCHAR(78)  | NOT NULL, DEFAULT '0'                                                                                                                              | 残高（文字列型） |
| updated_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW                                                                                                                              | 更新日時         |

### `transactions` テーブル

| カラム名           | データ型     | 制約                                                                                                                         | 説明               |
| ------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------ |
| id                 | UUID         | PRIMARY KEY                                                                                                                  | トランザクションID |
| user_id            | UUID         | NOT NULL, FOREIGN KEY REFERENCES users(id), **INDEX** `idx_transactions_user_id`, **複合INDEX** `idx_transactions_type_user` | ユーザーID         |
| transaction_type   | VARCHAR(50)  | NOT NULL, **複合INDEX** `idx_transactions_type_user`                                                                         | 取引タイプ         |
| from_token_address | VARCHAR(255) | FOREIGN KEY REFERENCES tokens(address), **INDEX** `idx_transactions_from_token`                                              | 送信元トークン     |
| to_token_address   | VARCHAR(255) | FOREIGN KEY REFERENCES tokens(address), **INDEX** `idx_transactions_to_token`                                                | 送信先トークン     |
| amount_from        | VARCHAR(78)  |                                                                                                                              | 送信元数量         |
| amount_to          | VARCHAR(78)  |                                                                                                                              | 送信先数量         |
| fee                | VARCHAR(78)  |                                                                                                                              | 手数料             |
| details            | JSONB        |                                                                                                                              | 詳細情報（JSON）   |
| created_at         | TIMESTAMP    | NOT NULL, DEFAULT NOW, **INDEX** `idx_transactions_created_at`                                                               | 作成日時           |

### `portfolio_snapshots` テーブル

| カラム名          | データ型      | 制約                                                                           | 説明                             |
| ----------------- | ------------- | ------------------------------------------------------------------------------ | -------------------------------- |
| id                | UUID          | PRIMARY KEY                                                                    | スナップショットID               |
| user_id           | UUID          | NOT NULL, FOREIGN KEY REFERENCES users(id), **複合INDEX** `user_timestamp_idx` | ユーザーID                       |
| timestamp         | TIMESTAMP     | NOT NULL, **INDEX** `timestamp_idx`, **複合INDEX** `user_timestamp_idx`        | スナップショット時刻             |
| total_value_usd   | DECIMAL(20,8) | NOT NULL                                                                       | ポートフォリオ総額（USD）        |
| pnl_from_previous | DECIMAL(20,8) |                                                                                | 前回スナップショットからのPnL    |
| pnl_from_start    | DECIMAL(20,8) |                                                                                | 初期ポートフォリオからのPnL      |
| snapshot_details  | JSONB         |                                                                                | 詳細なポートフォリオ構成（JSON） |
| created_at        | TIMESTAMP     | NOT NULL, DEFAULT NOW                                                          | 作成日時                         |

### `investments` テーブル

| カラム名         | データ型      | 制約                                                                                        | 説明                                         |
| ---------------- | ------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| id               | UUID          | PRIMARY KEY                                                                                 | 投資ID                                       |
| user_id          | UUID          | NOT NULL, FOREIGN KEY REFERENCES users(id), **INDEX** `idx_investments_user_id`             | ユーザーID                                   |
| token_address    | VARCHAR(255)  | NOT NULL, FOREIGN KEY REFERENCES tokens(address), **INDEX** `idx_investments_token_address` | トークンアドレス                             |
| action_type      | VARCHAR(50)   | NOT NULL, **INDEX** `idx_investments_action_type`                                           | 投資タイプ（staking/liquid_staking/lending） |
| principal        | VARCHAR(78)   | NOT NULL                                                                                    | 元本                                         |
| accrued_interest | VARCHAR(78)   | NOT NULL, DEFAULT '0'                                                                       | 累積利息                                     |
| start_date       | TIMESTAMP     | NOT NULL                                                                                    | 開始日時                                     |
| last_update      | TIMESTAMP     | NOT NULL                                                                                    | 最終更新日時                                 |
| interest_rate    | DECIMAL(10,5) | NOT NULL                                                                                    | 利率（%）                                    |
| status           | VARCHAR(20)   | NOT NULL, **INDEX** `idx_investments_status`                                                | ステータス（active/withdrawn）               |

### `perp_positions` テーブル

| カラム名                  | データ型      | 制約                                                                                 | 説明                                 |
| ------------------------- | ------------- | ------------------------------------------------------------------------------------ | ------------------------------------ |
| id                        | UUID          | PRIMARY KEY                                                                          | ポジションID                         |
| user_id                   | UUID          | NOT NULL, FOREIGN KEY REFERENCES users(id), **複合INDEX** `idx_perp_user_status`     | ユーザーID                           |
| token_address             | VARCHAR(255)  | NOT NULL, FOREIGN KEY REFERENCES tokens(address), **INDEX** `idx_perp_token_address` | トークンアドレス                     |
| position_direction        | VARCHAR(10)   | NOT NULL                                                                             | ポジション方向（long/short）         |
| leverage                  | INTEGER       | NOT NULL                                                                             | レバレッジ倍率                       |
| entry_price               | VARCHAR(78)   | NOT NULL                                                                             | エントリー価格                       |
| position_size             | VARCHAR(78)   | NOT NULL                                                                             | ポジションサイズ                     |
| collateral_amount         | VARCHAR(78)   | NOT NULL                                                                             | 証拠金額                             |
| liquidation_price         | VARCHAR(78)   | NOT NULL, **複合INDEX** `idx_perp_liquidation`                                       | 清算価格                             |
| entry_funding_rate        | DECIMAL(10,5) | NOT NULL                                                                             | エントリー時Funding Rate             |
| accumulated_funding       | VARCHAR(78)   | NOT NULL, DEFAULT '0'                                                                | 累積Funding調整額                    |
| funding_rate_last_applied | TIMESTAMP     | NOT NULL                                                                             | Funding Rate最終適用時刻             |
| status                    | VARCHAR(20)   | NOT NULL, **複合INDEX** `idx_perp_user_status`, **複合INDEX** `idx_perp_liquidation` | ステータス（open/closed/liquidated） |
| created_at                | TIMESTAMP     | NOT NULL, DEFAULT NOW                                                                | 作成日時                             |
| updated_at                | TIMESTAMP     | NOT NULL, DEFAULT NOW                                                                | 更新日時                             |

### `token_prices` テーブル

| カラム名      | データ型     | 制約                                                                                          | 説明             |
| ------------- | ------------ | --------------------------------------------------------------------------------------------- | ---------------- |
| id            | UUID         | PRIMARY KEY                                                                                   | ID               |
| token_address | VARCHAR(255) | NOT NULL, FOREIGN KEY REFERENCES tokens(address), **UNIQUE INDEX** `idx_token_prices_address` | トークンアドレス |
| price_usd     | VARCHAR(78)  | NOT NULL                                                                                      | USD価格          |
| last_updated  | TIMESTAMP    | NOT NULL, **INDEX** `idx_token_prices_updated`                                                | 最終更新時刻     |
| source        | VARCHAR(50)  | NOT NULL                                                                                      | 価格取得ソース   |

### `interest_rates` テーブル

| カラム名       | データ型      | 制約                                                                                       | 説明             |
| -------------- | ------------- | ------------------------------------------------------------------------------------------ | ---------------- |
| id             | UUID          | PRIMARY KEY                                                                                | ID               |
| token_address  | VARCHAR(255)  | NOT NULL, FOREIGN KEY REFERENCES tokens(address), **複合INDEX** `idx_interest_rates_token` | トークンアドレス |
| action_type    | VARCHAR(50)   | NOT NULL, **複合INDEX** `idx_interest_rates_token`                                         | アクションタイプ |
| interest_rate  | DECIMAL(10,5) | NOT NULL                                                                                   | 利率（%）        |
| effective_date | TIMESTAMP     | NOT NULL, **INDEX** `idx_interest_rates_effective`                                         | 有効日           |

### `funding_rates` テーブル

| カラム名      | データ型      | 制約                                                                                  | 説明             |
| ------------- | ------------- | ------------------------------------------------------------------------------------- | ---------------- |
| id            | UUID          | PRIMARY KEY                                                                           | ID               |
| token_address | VARCHAR(255)  | NOT NULL, FOREIGN KEY REFERENCES tokens(address), **INDEX** `idx_funding_rates_token` | トークンアドレス |
| rate          | DECIMAL(10,5) | NOT NULL                                                                              | Funding Rate     |
| timestamp     | TIMESTAMP     | NOT NULL, **INDEX** `idx_funding_rates_timestamp`                                     | 適用時刻         |

## 6. API設計

### API一覧

#### ユーザー関連API

| エンドポイント               | メソッド | パラメータ                           | リクエストボディ                                                             | 説明                                     |
| ---------------------------- | -------- | ------------------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------- |
| `/api/users/:wallet_address` | GET      | `wallet_address`: ウォレットアドレス | -                                                                            | ウォレットアドレスからユーザー情報を取得 |
| `/api/users`                 | POST     | -                                    | `wallet_address`: ウォレットアドレス<br>`username`: ユーザー名（オプション） | 新規ユーザー登録                         |

<details>
<summary>実装コード例</summary>

```typescript
// GET /api/users/:wallet_address
async function getUserByWallet(wallet_address: string) {
  // ウォレットアドレスからユーザーを取得
  // 存在しない場合は新規作成
  return user;
}

// POST /api/users
async function createUser(userData: Partial<User>) {
  // 新規ユーザー作成
  return newUser;
}
```

</details>

#### ポートフォリオ関連API

| エンドポイント                   | メソッド | パラメータ                                                                        | リクエストボディ | 説明                               |
| -------------------------------- | -------- | --------------------------------------------------------------------------------- | ---------------- | ---------------------------------- |
| `/api/portfolio/:wallet_address` | GET      | `wallet_address`: ウォレットアドレス<br>`force_refresh`(optional): 価格更新フラグ | -                | ユーザーのポートフォリオ情報を取得 |
| `/api/pnl/:wallet_address`       | GET      | `wallet_address`: ウォレットアドレス<br>`period`: 期間(1d/7d/30d/90d/1y)          | -                | 指定期間のPnL時系列データを取得    |

<details>
<summary>実装コード例</summary>

```typescript
// GET /api/portfolio/:wallet_address
async function getUserPortfolio(walletAddress: string, forceRefresh = false) {
  // アクティブセッション管理
  startUserSession(walletAddress);

  try {
    // ウォレットアドレスからユーザーを特定
    const user = await db.users.findFirst({
      where: { wallet_address: walletAddress },
    });

    if (!user) throw new Error("User not found");

    // ユーザーの全トークン残高を取得
    const balances = await db.userBalances.findMany({
      where: { user_id: user.id },
      include: { token: true },
    });

    // ユーザーが表示中かつ強制更新フラグがある場合は、保有トークンの価格を更新
    if (forceRefresh) {
      await refreshTokenPrices(balances.map((b) => b.token_address));
    }

    // 最新のトークン価格を取得
    const tokenAddresses = balances.map((balance) => balance.token_address);
    const prices = await db.tokenPrices.findMany({
      where: { token_address: { in: tokenAddresses } },
    });

    // 価格マップを作成
    const priceMap = prices.reduce((map, price) => {
      map[price.token_address] = price.price_usd;
      return map;
    }, {});

    // ポートフォリオデータを構築
    const portfolio = balances.map((balance) => {
      const tokenPrice = priceMap[balance.token_address] || "0";
      const valueUsd = new BigNumber(balance.balance).multipliedBy(tokenPrice).toString();

      return {
        token: balance.token.symbol,
        token_address: balance.token.address,
        balance: balance.balance,
        price_usd: tokenPrice,
        value_usd: valueUsd,
      };
    });

    // Perp ポジションがある場合はそれも含める
    const perpPositions = await db.perpPositions.findMany({
      where: {
        user_id: user.id,
        status: "open",
      },
      include: { token: true },
    });

    // Perpポジションの評価額を計算
    let perpPositionsData = [];
    for (const position of perpPositions) {
      const currentPrice = priceMap[position.token_address] || "0";
      // PnL計算ロジック...
      // perpPositionsDataに追加
    }

    // 合計額計算
    const totalValue = portfolio
      .reduce((sum, item) => {
        return sum.plus(item.value_usd);
      }, new BigNumber(0))
      .toString();

    return {
      wallet_address: walletAddress,
      total_value_usd: totalValue,
      tokens: portfolio,
      perp_positions: perpPositionsData,
      last_updated: new Date(),
      prices_age: getPricesAge(prices), // 価格データの鮮度情報を追加
    };
  } finally {
    // セッション終了時にカウントを減らす（タイムアウトベース）
    scheduleSessionEnd(walletAddress);
  }
}

// GET /api/pnl/:wallet_address
async function getUserPnLTimeseries(walletAddress: string, period = "1d") {
  // ユーザー取得
  const user = await db.users.findFirst({
    where: { wallet_address: walletAddress },
  });

  if (!user) throw new Error("User not found");

  // 期間に応じた日時計算
  const now = new Date();
  let startDate = new Date();
  let dataPointCount: number;

  switch (period) {
    case "1d":
      startDate.setDate(now.getDate() - 1);
      dataPointCount = 24; // 1時間おき
      break;
    case "7d":
      startDate.setDate(now.getDate() - 7);
      dataPointCount = 42; // 4時間おき
      break;
    case "30d":
      startDate.setDate(now.getDate() - 30);
      dataPointCount = 60; // 12時間おき
      break;
    case "90d":
      startDate.setDate(now.getDate() - 90);
      dataPointCount = 45; // 2日おき
      break;
    case "1y":
      startDate.setFullYear(now.getFullYear() - 1);
      dataPointCount = 52; // 1週間おき
      break;
    default:
      startDate.setDate(now.getDate() - 1);
      dataPointCount = 24;
  }

  // データ取得（期間や粒度に応じて最適化されたクエリ）
  const snapshots = await db.$queryRaw`
    WITH numbered_snapshots AS (
      SELECT 
        id, 
        timestamp, 
        total_value_usd,
        pnl_from_start,
        ROW_NUMBER() OVER (ORDER BY timestamp) as row_num,
        COUNT(*) OVER () as total_count
      FROM portfolio_snapshots
      WHERE 
        user_id = ${user.id}
        AND timestamp >= ${startDate}
        AND timestamp <= ${now}
      ORDER BY timestamp
    )
    SELECT *
    FROM numbered_snapshots
    WHERE 
      row_num = 1 
      OR row_num = total_count 
      OR row_num % GREATEST(1, CEIL(total_count::float / ${dataPointCount})) = 0
    ORDER BY timestamp;
  `;

  // 結果がない場合は現在のポートフォリオ価値のみ返す
  if (snapshots.length === 0) {
    const currentValue = await calculateUserPortfolioValue(user.id);
    return {
      wallet_address: walletAddress,
      period,
      data_points: 1,
      pnl_data: [
        {
          timestamp: now,
          value: currentValue,
          pnl_absolute: "0",
          pnl_percentage: "0",
        },
      ],
    };
  }

  // 最初のスナップショット値（基準値）
  const initialValue = snapshots[0].total_value_usd;

  // PnLデータの整形
  const pnlData = snapshots.map((snapshot) => {
    const value = snapshot.total_value_usd;
    const pnlAbsolute = new BigNumber(value).minus(initialValue).toString();
    const pnlPercentage =
      initialValue !== "0" ? new BigNumber(pnlAbsolute).dividedBy(initialValue).multipliedBy(100).toString() : "0";

    return {
      timestamp: snapshot.timestamp,
      value: value,
      pnl_absolute: pnlAbsolute,
      pnl_percentage: pnlPercentage,
    };
  });

  return {
    wallet_address: walletAddress,
    period,
    data_points: pnlData.length,
    pnl_data: pnlData,
    // サマリー情報
    summary: {
      initial_value: initialValue,
      current_value: pnlData[pnlData.length - 1].value,
      pnl_absolute: pnlData[pnlData.length - 1].pnl_absolute,
      pnl_percentage: pnlData[pnlData.length - 1].pnl_percentage,
    },
  };
}
```

</details>

#### トークン関連API

| エンドポイント | メソッド | パラメータ                               | リクエストボディ | 説明                               |
| -------------- | -------- | ---------------------------------------- | ---------------- | ---------------------------------- |
| `/api/tokens`  | GET      | -                                        | -                | サポートされているトークン一覧取得 |
| `/api/prices`  | GET      | `tokens`: カンマ区切りのトークンアドレス | -                | 指定トークンの最新価格取得         |

<details>
<summary>実装コード例</summary>

```typescript
// GET /api/tokens
async function getTokens() {
  // 全トークン一覧を取得
  return tokens;
}

// GET /api/prices?tokens=token1,token2,...
async function getTokenPrices(tokenAddresses: string[]) {
  // DBからキャッシュされた価格を取得
  const prices = await db.tokenPrices.findMany({
    where: {
      token_address: { in: tokenAddresses },
    },
    include: { token: true },
  });

  // 各トークンの価格データを構築
  const priceData = prices.map((price) => ({
    token_address: price.token_address,
    symbol: price.token.symbol,
    price_usd: price.price_usd,
    last_updated: price.last_updated,
  }));

  return {
    prices: priceData,
    timestamp: new Date(),
  };
}
```

</details>

#### 取引関連API

| エンドポイント                      | メソッド | パラメータ                                                                                                                                  | リクエストボディ                                                                                                                 | 説明                 |
| ----------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| `/api/swap`                         | POST     | -                                                                                                                                           | `wallet_address`: ウォレットアドレス<br>`from_token_address`: 売却トークン<br>`to_token_address`: 購入トークン<br>`amount`: 数量 | トークンスワップ実行 |
| `/api/transactions/:wallet_address` | GET      | `wallet_address`: ウォレットアドレス<br>`limit`(optional): 取得件数<br>`offset`(optional): オフセット<br>`type`(optional): 取引種別フィルタ | -                                                                                                                                | 取引履歴の取得       |

<details>
<summary>実装コード例</summary>

```typescript
// POST /api/swap
async function swapTokens(
  wallet_address: string,
  from_token_address: string,
  to_token_address: string,
  amount: string,
) {
  // ユーザー取得
  // スワップ実行
  // トランザクション記録
  return { success: true, details: { ... } };
}

// GET /api/transactions/:wallet_address
async function getUserTransactions(
  wallet_address: string,
  limit: number = 20,
  offset: number = 0,
  type?: TransactionType,
) {
  // トランザクション履歴取得
  return {
    transactions: [...],
    total: 45,
    limit: 20,
    offset: 0
  };
}
```

</details>

#### 投資関連API

| エンドポイント                     | メソッド | パラメータ                           | リクエストボディ                                                                            | 説明                   |
| ---------------------------------- | -------- | ------------------------------------ | ------------------------------------------------------------------------------------------- | ---------------------- |
| `/api/stake`                       | POST     | -                                    | `wallet_address`: ウォレットアドレス<br>`token_address`: トークンアドレス<br>`amount`: 数量 | トークンをステーキング |
| `/api/unstake`                     | POST     | -                                    | `wallet_address`: ウォレットアドレス<br>`investment_id`: 投資ID                             | ステーキングを解除     |
| `/api/liquid-stake`                | POST     | -                                    | `wallet_address`: ウォレットアドレス<br>`token_address`: トークンアドレス<br>`amount`: 数量 | Liquid Staking実行     |
| `/api/investments/:wallet_address` | GET      | `wallet_address`: ウォレットアドレス | -                                                                                           | 投資状況一覧取得       |

<details>
<summary>実装コード例</summary>

```typescript
// POST /api/stake
async function stakeToken(
  wallet_address: string,
  token_address: string,
  amount: string,
) {
  // ステーキング処理
  return { success: true, details: { ... } };
}

// POST /api/unstake
async function unstakeToken(
  wallet_address: string,
  investment_id: string,
) {
  // アンステーキング処理
  return { success: true, details: { ... } };
}

// POST /api/liquid-stake
async function liquidStakeToken(
  wallet_address: string,
  token_address: string,
  amount: string,
) {
  // リキッドステーキング処理
  return { success: true, details: { ... } };
}

// GET /api/investments/:wallet_address
async function getUserInvestments(
  wallet_address: string,
) {
  // 投資一覧取得
  return { investments: [...] };
}
```

</details>

#### Perp Trading関連API

| エンドポイント                        | メソッド | パラメータ                           | リクエストボディ                                                                                                                                                         | 説明                       |
| ------------------------------------- | -------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| `/api/perp/open`                      | POST     | -                                    | `wallet_address`: ウォレットアドレス<br>`token_address`: トークンアドレス<br>`collateral_amount`: 証拠金額<br>`leverage`: レバレッジ<br>`direction`: "long"または"short" | Perpポジションを開く       |
| `/api/perp/close/:position_id`        | POST     | `position_id`: ポジションID          | `wallet_address`: ウォレットアドレス                                                                                                                                     | Perpポジションを閉じる     |
| `/api/perp/positions/:wallet_address` | GET      | `wallet_address`: ウォレットアドレス | -                                                                                                                                                                        | オープンポジション一覧取得 |

<details>
<summary>実装コード例</summary>

```typescript
// POST /api/perp/open
async function openPerpPosition(
  wallet_address: string,
  token_address: string,
  collateral_amount: string,
  leverage: number,
  direction: "long" | "short",
) {
  // ポジションオープン処理
  return { success: true, position_id: "...", details: { ... } };
}

// POST /api/perp/close/:position_id
async function closePerpPosition(
  wallet_address: string,
  position_id: string,
) {
  // ポジションクローズ処理
  return { success: true, pnl: "...", details: { ... } };
}

// GET /api/perp/positions/:wallet_address
async function getUserPerpPositions(
  wallet_address: string,
) {
  // オープンポジション一覧取得
  return { positions: [...] };
}
```

</details>

#### ランキング関連API

| エンドポイント     | メソッド | パラメータ                      | リクエストボディ | 説明                      |
| ------------------ | -------- | ------------------------------- | ---------------- | ------------------------- |
| `/api/leaderboard` | GET      | `limit`(optional): 上位表示件数 | -                | ユーザーPnLランキング取得 |

<details>
<summary>実装コード例</summary>

```typescript
// GET /api/leaderboard
async function getLeaderboard(limit: number = 20) {
  // ユーザーPnLランキング取得
  return { users: [...] };
}
```

</details>

### セッション管理API（バックエンド内部利用）

<details>
<summary>実装コード例</summary>

```typescript
// アクティブユーザーセッション管理（Redis実装例）
async function startUserSession(walletAddress: string) {
  // Redis接続
  const redis = getRedisClient();

  // セッションカウント増加
  await redis.incr("active_sessions");

  // このユーザーのセッションをセット（TTL: 5分）
  await redis.set(`session:${walletAddress}`, Date.now(), "EX", 300);

  // ユーザーの保有トークンの更新頻度スコアを増加
  const userTokens = await getUserTokens(walletAddress);
  for (const token of userTokens) {
    await redis.zincrby("token_frequency", 1, token);
  }
}

// セッション終了スケジュール
function scheduleSessionEnd(walletAddress: string) {
  // 実際の実装ではRedisのTTL機能を利用
  // ここではシンプルにタイムアウト例を示す
  setTimeout(async () => {
    const redis = getRedisClient();

    // セッションが既に期限切れでないか確認
    const exists = await redis.exists(`session:${walletAddress}`);
    if (!exists) return;

    // セッションカウント減少
    await redis.decr("active_sessions");

    // このユーザーのセッションを削除
    await redis.del(`session:${walletAddress}`);

    // ユーザーの保有トークンの更新頻度スコアを減少
    const userTokens = await getUserTokens(walletAddress);
    for (const token of userTokens) {
      await redis.zincrby("token_frequency", -1, token);
    }
  }, 300000); // 5分後
}
```

</details>

## 7. バッチジョブと処理フロー

### a. 初期ポートフォリオ配布

<details>
<summary>実装コード例</summary>

```typescript
// テスト開始時に実行
async function distributeInitialPortfolios() {
  // 全ユーザーを取得
  const users = await db.users.findMany();

  // 初期トークン配分設定
  const initialTokens = [
    { address: "So11111111111111111111111111111111111111112", amount: "10" }, // SOL
    { address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", amount: "1000" }, // USDC
    // 他のトークン...
  ];

  // 各ユーザーに配布
  for (const user of users) {
    for (const token of initialTokens) {
      await db.userBalances.upsert({
        where: {
          user_id_token_address: {
            user_id: user.id,
            token_address: token.address,
          },
        },
        update: {
          balance: token.amount,
        },
        create: {
          user_id: user.id,
          token_address: token.address,
          balance: token.amount,
        },
      });
    }

    // トランザクションログ作成
    await db.transactions.create({
      data: {
        user_id: user.id,
        transaction_type: "system",
        details: {
          action: "initial_distribution",
          tokens: initialTokens,
        },
      },
    });
  }
}
```

</details>

### b. トークン価格更新処理

<details>
<summary>実装コード例</summary>

```typescript
// 定期的な価格更新バッチ処理（10分間隔で実行）
async function updateTokenPrices() {
  // すべてのトークンアドレスを取得
  const tokens = await db.tokens.findMany();

  // Jupiter APIから価格を取得
  const tokenAddresses = tokens.map((token) => token.address);
  const pricesResponse = await fetch(`https://api.jup.ag/price/v2?ids=${tokenAddresses.join(",")}`);
  const pricesData = await pricesResponse.json();

  // 各トークンの価格を更新
  for (const token of tokens) {
    await db.tokenPrices.upsert({
      where: { token_address: token.address },
      update: {
        price_usd: pricesData[token.address]?.toString() || "0",
        last_updated: new Date(),
        source: "jupiter",
      },
      create: {
        token_address: token.address,
        price_usd: pricesData[token.address]?.toString() || "0",
        last_updated: new Date(),
        source: "jupiter",
      },
    });
  }
}

// 特定トークンの価格のみを更新（レート制限を考慮）
async function refreshTokenPrices(tokenAddresses: string[]) {
  // 最後の更新から30秒以上経過したトークンのみ更新対象とする
  const now = new Date();
  const staleTokens = await db.tokenPrices.findMany({
    where: {
      token_address: { in: tokenAddresses },
      last_updated: {
        lt: new Date(now.getTime() - 30 * 1000), // 30秒前より古いもの
      },
    },
  });

  // 更新対象がなければ終了
  if (staleTokens.length === 0) return;

  // 更新対象のトークンアドレスのみ抽出
  const staleAddresses = staleTokens.map((t) => t.token_address);

  try {
    // Jupiter APIから価格取得
    const pricesResponse = await fetch(`https://api.jup.ag/price/v2?ids=${staleAddresses.join(",")}`);
    if (!pricesResponse.ok) {
      console.error("Failed to fetch prices from Jupiter API:", pricesResponse.statusText);
      return;
    }

    const pricesData = await pricesResponse.json();

    // DBに更新
    for (const tokenPrice of staleTokens) {
      await db.tokenPrices.update({
        where: { id: tokenPrice.id },
        data: {
          price_usd: pricesData[tokenPrice.token_address]?.toString() || tokenPrice.price_usd,
          last_updated: now,
        },
      });
    }
  } catch (error) {
    console.error("Error refreshing token prices:", error);
    // エラー時はリトライロジックを実装
  }
}
```

</details>

### c. 日次利息適用処理

<details>
<summary>実装コード例</summary>

```typescript
// 日次バッチで利息を付与（毎日0時に実行）
async function applyDailyInterest() {
  // 全アクティブなステーキングとリキッドステーキングを取得
  const activeInvestments = await db.investments.findMany({
    where: {
      status: "active",
      action_type: { in: ["staking", "liquid_staking"] },
    },
  });

  // 各投資に対して日次利息を適用
  for (const investment of activeInvestments) {
    // 日利計算（年利から日利へ変換）
    const dailyInterestRate = investment.interest_rate / 365;

    // 元本に対する利息計算
    const principal = new BigNumber(investment.principal);
    const dailyInterest = principal.multipliedBy(dailyInterestRate).dividedBy(100);

    // 累積利息の更新
    const newAccruedInterest = new BigNumber(investment.accrued_interest).plus(dailyInterest);

    // DB更新
    await db.investments.update({
      where: { id: investment.id },
      data: {
        accrued_interest: newAccruedInterest.toString(),
        last_update: new Date(),
      },
    });

    // リキッドステーキングの場合はuser_balancesも更新
    if (investment.action_type === "liquid_staking") {
      // 対応するLSTトークンを取得
      const lstToken = await db.tokens.findFirst({
        where: {
          type: "liquid_staking",
          // 対応するベーストークンの条件（実装により異なる）
        },
      });

      if (lstToken) {
        // ユーザーのLST残高を更新
        await db.userBalances.updateMany({
          where: {
            user_id: investment.user_id,
            token_address: lstToken.address,
          },
          data: {
            // LST価値の増加を反映
            // 実装により、価値増加の反映方法は異なる
          },
        });
      }
    }
  }
}
```

</details>

### d. Funding Rate適用処理

<details>
<summary>実装コード例</summary>

```typescript
// Funding Rate適用（8時間ごとに実行）
async function applyFundingRates() {
  // 最新のFunding Rateを取得または計算
  const fundingRates = await calculateFundingRates();

  // 全オープンポジションを取得
  const openPositions = await db.perpPositions.findMany({
    where: { status: "open" },
  });

  // 各ポジションにFunding Rateを適用
  for (const position of openPositions) {
    const tokenRate = fundingRates.find((r) => r.token_address === position.token_address);
    if (!tokenRate) continue;

    // 前回適用からの経過時間に応じて調整
    const hoursSinceLastApplied =
      (new Date().getTime() - position.funding_rate_last_applied.getTime()) / (1000 * 60 * 60);

    // ポジションサイズに基づくFunding金額計算
    const positionSize = new BigNumber(position.position_size);
    const fundingAmount = positionSize.multipliedBy(tokenRate.rate).multipliedBy(hoursSinceLastApplied / 8); // 8時間ごとの適用を仮定

    // Long/Shortに応じて加算/減算
    const adjustedAmount =
      position.position_direction === "long"
        ? fundingAmount.negated() // Longはマイナス（支払い）
        : fundingAmount; // Shortはプラス（受取り）

    // 累積Funding調整額を更新
    const newAccumulatedFunding = new BigNumber(position.accumulated_funding).plus(adjustedAmount);

    // ポジション更新
    await db.perpPositions.update({
      where: { id: position.id },
      data: {
        accumulated_funding: newAccumulatedFunding.toString(),
        funding_rate_last_applied: new Date(),
      },
    });
  }

  // Funding Rateの履歴保存
  for (const rate of fundingRates) {
    await db.fundingRates.create({
      data: {
        token_address: rate.token_address,
        rate: rate.rate,
        timestamp: new Date(),
      },
    });
  }
}
```

</details>

### e. ポジション清算チェック処理

<details>
<summary>実装コード例</summary>

```typescript
// 清算チェック（5分間隔で実行）
async function checkForLiquidations() {
  // 全オープンポジションを取得
  const openPositions = await db.perpPositions.findMany({
    where: { status: "open" },
  });

  // 各ポジションについて清算チェック
  for (const position of openPositions) {
    // 現在の市場価格を取得
    const tokenPrice = await db.tokenPrices.findFirst({
      where: { token_address: position.token_address },
    });

    if (!tokenPrice) continue;

    const currentPrice = new BigNumber(tokenPrice.price_usd);
    const liquidationPrice = new BigNumber(position.liquidation_price);

    // 清算条件チェック
    const shouldLiquidate =
      position.position_direction === "long"
        ? currentPrice.lte(liquidationPrice) // Long: 現在価格 <= 清算価格
        : currentPrice.gte(liquidationPrice); // Short: 現在価格 >= 清算価格

    if (shouldLiquidate) {
      // ポジションを清算
      await liquidatePosition(position.id, currentPrice.toString());
    }
  }
}

// ポジション清算処理
async function liquidatePosition(positionId: string, currentPrice: string) {
  // ポジション取得
  const position = await db.perpPositions.findUnique({
    where: { id: positionId },
    include: { user: true },
  });

  if (!position) return;

  // ポジションを清算済みにマーク
  await db.perpPositions.update({
    where: { id: positionId },
    data: { status: "liquidated" },
  });

  // トランザクション記録
  await db.transactions.create({
    data: {
      user_id: position.user_id,
      transaction_type: "perp_liquidation",
      from_token_address: position.token_address,
      amount_from: position.position_size,
      details: {
        position_id: positionId,
        entry_price: position.entry_price,
        liquidation_price: position.liquidation_price,
        current_price: currentPrice,
        direction: position.position_direction,
        leverage: position.leverage,
        accumulated_funding: position.accumulated_funding,
      },
    },
  });

  // ユーザーに通知（オプション）
  await notifyUser(position.user_id, "liquidation", {
    position_id: positionId,
    token: position.token_address,
    direction: position.position_direction,
    liquidation_price: position.liquidation_price,
  });
}
```

</details>

### f. ポートフォリオスナップショット処理

ユーザーのPnLを時系列で追跡し、様々な期間（1日、1週間、1ヶ月など）での表示を可能にするため、ポートフォリオスナップショットを定期的に取得・保存します。

#### スナップショット取得処理の概要

- **実行頻度**: 1時間ごと
- **処理内容**: 全ユーザーのポートフォリオ価値を計算し、スナップショットとして保存
- **価格データ**: 常に最新の市場価格を使用してPnLを計算（token_pricesテーブルから取得）
- **ストレージ最適化**: 古いデータは段階的に間引いて保存

<details>
<summary>実装コード例</summary>

```typescript
// 1時間ごとに実行するスナップショットバッチ処理
async function capturePortfolioSnapshots() {
  console.log("Starting portfolio snapshot capture at", new Date());

  // 全ユーザー取得
  const users = await db.users.findMany();

  for (const user of users) {
    try {
      // 最新の市場価格を取得
      const userTokens = await db.userBalances.findMany({
        where: { user_id: user.id },
        include: { token: true },
      });

      const tokenAddresses = userTokens.map((balance) => balance.token_address);

      // 最新の市場価格を使用するため、強制更新
      await refreshTokenPrices(tokenAddresses);

      // 現在のポートフォリオ価値計算
      const portfolio = await calculateUserPortfolio(user.id);

      // 前回のスナップショット取得
      const previousSnapshot = await db.portfolioSnapshots.findFirst({
        where: { user_id: user.id },
        orderBy: { timestamp: "desc" },
      });

      // 初回スナップショット取得（PnL計算用）
      const initialSnapshot = await db.portfolioSnapshots.findFirst({
        where: { user_id: user.id },
        orderBy: { timestamp: "asc" },
      });

      // PnL計算
      const pnlFromPrevious = previousSnapshot
        ? new BigNumber(portfolio.total_value_usd).minus(previousSnapshot.total_value_usd).toString()
        : "0";

      const pnlFromStart = initialSnapshot
        ? new BigNumber(portfolio.total_value_usd).minus(initialSnapshot.total_value_usd).toString()
        : "0";

      // スナップショット保存
      await db.portfolioSnapshots.create({
        data: {
          user_id: user.id,
          timestamp: new Date(),
          total_value_usd: portfolio.total_value_usd,
          pnl_from_previous: pnlFromPrevious,
          pnl_from_start: pnlFromStart,
          snapshot_details: {
            tokens: portfolio.tokens,
            perp_positions: portfolio.perp_positions || [],
            investments: portfolio.investments || [],
          },
        },
      });
    } catch (error) {
      console.error(`Error capturing snapshot for user ${user.id}:`, error);
    }
  }

  // データ間引き処理を実行（週に1回、日曜の深夜など）
  const now = new Date();
  if (now.getDay() === 0 && now.getHours() === 1) {
    await pruneOldSnapshots();
  }

  console.log("Completed portfolio snapshot capture at", new Date());
}

// 古いスナップショットデータを間引く処理
async function pruneOldSnapshots() {
  console.log("Starting pruning of old snapshots");

  // 1〜3ヶ月前のデータを3時間おきに間引く
  await db.$executeRaw`
    WITH samples AS (
      SELECT 
        id,
        user_id,
        timestamp,
        ROW_NUMBER() OVER (PARTITION BY user_id, DATE_TRUNC('day', timestamp) ORDER BY timestamp) as row_num
      FROM portfolio_snapshots
      WHERE 
        timestamp < NOW() - INTERVAL '1 month' AND
        timestamp >= NOW() - INTERVAL '3 months'
    )
    DELETE FROM portfolio_snapshots
    WHERE id IN (
      SELECT id FROM samples
      WHERE row_num % 3 != 0  -- 3時間おきのデータを残す
    );
  `;

  // 3ヶ月以上前のデータを日次データのみに間引く
  await db.$executeRaw`
    WITH daily_samples AS (
      SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY user_id, DATE_TRUNC('day', timestamp) ORDER BY timestamp DESC) as row_num
      FROM portfolio_snapshots
      WHERE timestamp < NOW() - INTERVAL '3 months'
    )
    DELETE FROM portfolio_snapshots
    WHERE id IN (
      SELECT id FROM daily_samples
      WHERE row_num > 1  -- 各日の最新スナップショットのみ残す
    );
  `;

  console.log("Completed pruning of old snapshots");
}
```

</details>

## 8. フロントエンド連携

フロントエンドでは以下の方法でデータを取得・表示します：

1. ユーザーのウォレット接続時に、ウォレットアドレスをバックエンドに送信
2. `/api/portfolio/:wallet_address` エンドポイントから完全なポートフォリオデータを取得
3. ポートフォリオ画面で各トークンの残高、USD価値、合計価値を表示
4. 最適な更新戦略の実装

<details>
<summary>実装コード例（React Hooks）</summary>

```typescript
// React Hooks例
function usePortfolio(walletAddress: string) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 初回読み込み
  useEffect(() => {
    fetchPortfolio(false);
  }, [walletAddress]);

  // ページがアクティブな間は30秒ごとに更新
  useEffect(() => {
    if (!walletAddress) return;

    // ページがフォーカスされたら最新データを取得
    const handleFocus = () => fetchPortfolio(true);
    window.addEventListener("focus", handleFocus);

    // 定期更新のインターバル設定
    const interval = setInterval(() => {
      // ページがアクティブな場合のみ更新
      if (document.visibilityState === "visible") {
        fetchPortfolio(false);
      }
    }, 30000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [walletAddress]);

  // データ取得関数
  const fetchPortfolio = async (forceRefresh = false) => {
    if (!walletAddress) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/portfolio/${walletAddress}?forceRefresh=${forceRefresh}`);
      if (!response.ok) throw new Error("Failed to fetch portfolio");

      const data = await response.json();
      setPortfolio(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { portfolio, loading, error, refresh: () => fetchPortfolio(true) };
}
```

</details>

## 9. 技術的考慮事項

### データ整合性

- トランザクション処理は、原子性を保証する仕組みを導入
- バッチ処理の結果、特にFunding Rate適用や利息計算の履歴を監査可能にする

### パフォーマンス

- ポートフォリオ評価などの頻繁なAPIコールに対して、適切なキャッシュ戦略を検討
- 定期バッチ処理の実行タイミングと頻度の最適化

### セキュリティ

- αテスト段階では実際の資産は扱わないが、本番環境と同様のセキュリティ対策を講じる
- ユーザーアクション（特にperp取引など）の適切な検証ロジックの実装

### 拡張性

- 将来的なDEXインテグレーションやより複雑な取引戦略にも対応できる設計
- ステーキング、レンディング、Perp取引など各機能が独立して拡張可能なモジュール設計

## 10. 課題と制限事項

- αテスト環境では実際のオンチェーンデータとの連携は最小限とし、主にDB内シミュレーションに注力
- 市場価格データはJupiter APIから定期的に取得し、実際の市場状況を反映
- 高度なトレーディング機能（指値注文、複雑なポジション管理など）は初期フェーズでは実装しない
- Jupiter APIの利用制限に注意し、適切なエラーハンドリングとフォールバック戦略を実装する

## 11. トークン価格更新戦略

APIのレート制限を考慮しつつ、ユーザーが閲覧中はリアルタイムなデータを提供するために、以下の階層的な更新戦略を採用します：

1. **定期バックグラウンド更新**

   - すべてのトークン価格を10分間隔で更新（APIレート制限を考慮）
   - 市場の変動が少ない深夜帯などは間隔を15分に延長

2. **ユーザーアクティビティベース更新**

   - ユーザーがポートフォリオページを閲覧中は、そのユーザーが保有するトークンのみを優先的に更新
   - ページがフォーカスされたときに、最新データを取得
   - アクティブユーザー数に応じて更新頻度を調整

3. **スマートキャッシュ**
   - 最後の更新から30秒以内のデータは再取得しない
   - 複数ユーザーが同じトークンを閲覧している場合は一度の更新を共有
   - 価格の変動が大きいトークンを優先的に更新

#### データ保持ポリシー

ストレージ効率化と十分な精度のバランスを取るため、以下のデータ保持ポリシーを採用します：

| 期間       | データ保持粒度                     | 目的                                      |
| ---------- | ---------------------------------- | ----------------------------------------- |
| 直近30日間 | 1時間ごとのスナップショット        | 詳細な短期PnL分析、日次・週次グラフ表示用 |
| 1〜3ヶ月   | 3時間ごとに間引いたデータ          | 中期トレンド分析用                        |
| 3ヶ月以上  | 日次データ（1日1スナップショット） | 長期トレンド分析用                        |

## 12. システム規模とパフォーマンス分析

### 12.1 想定ユーザー数とトランザクション量

αテスト期間中の以下の規模を想定しています：

| 項目                          | 想定数          | 備考                                 |
| ----------------------------- | --------------- | ------------------------------------ |
| 同時接続ユーザー数（ピーク）  | 100〜200人      | プロモーション時などのピーク時を想定 |
| 登録ユーザー総数              | 1,000〜2,000人  | 2週間のテスト期間全体で              |
| 1日あたりのトランザクション数 | 5,000〜10,000件 | スワップ、ステーキング等の全取引量   |
| 保持トークン種類              | 20〜30種類      | 主要なcryptoアセットとLSTトークン    |
| バッチ処理レコード数（最大）  | 数万〜10万件    | スナップショット取得時など           |

### 12.2 データベーステーブルサイズ予測

2週間のテスト期間における各テーブルの予想レコード数：

| テーブル名          | 予想レコード数 | 増加ペース              | 備考                                      |
| ------------------- | -------------- | ----------------------- | ----------------------------------------- |
| users               | 1,000〜2,000   | ほぼ一定                | ユーザー登録時に1レコード                 |
| tokens              | 20〜30         | ほぼ一定                | サポートするトークン数                    |
| user_balances       | 2万〜6万       | ユーザー数×トークン数   | 各ユーザーのトークン保有状況              |
| transactions        | 7万〜15万      | 5,000〜10,000/日        | すべての取引履歴                          |
| portfolio_snapshots | 33万〜67万     | 1時間ごとにユーザー数分 | 全ユーザー×1時間ごと×2週間                |
| investments         | 1万〜3万       | 変動あり                | ステーキング、LST投資など                 |
| perp_positions      | 5,000〜1万     | 変動あり                | Phase 2で追加されるレバレッジ取引         |
| token_prices        | 1万〜1.5万     | トークン数×1日144回     | 10分ごとの価格更新（全トークン）          |
| interest_rates      | 100〜300       | 変動あり                | 各トークンのステーキング利率などの更新    |
| funding_rates       | 1,800〜2,700   | トークン数×1日3回       | 8時間ごとのFunding Rate記録（全トークン） |

### 12.3 クエリパターンとインデックス最適化

主要なクエリパターンとそれに対するインデックス戦略：

#### ポートフォリオ表示（高頻度クエリ）

```sql
-- ユーザー残高取得（高頻度）
SELECT * FROM user_balances WHERE user_id = ?

-- 価格情報取得（高頻度）
SELECT * FROM token_prices WHERE token_address IN (?) ORDER BY last_updated DESC
```

- **最適化**: `user_balances`テーブルの`user_id`カラムへのインデックス（`idx_user_balances_user_token`）、`token_prices`の`token_address`カラムへのユニークインデックス（`idx_token_prices_address`）
- **効果**: ユーザーごとの資産一覧表示が O(log n) で高速に実行可能

#### トランザクション履歴（中頻度クエリ）

```sql
-- ユーザー取引履歴取得（ページネーション付き）
SELECT * FROM transactions
WHERE user_id = ?
ORDER BY created_at DESC
LIMIT ? OFFSET ?

-- 取引タイプ別フィルタリング
SELECT * FROM transactions
WHERE user_id = ? AND transaction_type = ?
ORDER BY created_at DESC
```

- **最適化**: `transactions`テーブルの複合インデックス（`idx_transactions_type_user`）と`created_at`へのインデックス（`idx_transactions_created_at`）
- **効果**: トランザクション履歴のフィルタリングとソートが効率的に行える

#### ポジション清算チェック（バッチ処理）

```sql
-- 清算対象ポジション特定
SELECT * FROM perp_positions
WHERE status = 'open' AND
      (position_direction = 'long' AND liquidation_price >= ?) OR
      (position_direction = 'short' AND liquidation_price <= ?)
```

- **最適化**: `perp_positions`テーブルの複合インデックス（`idx_perp_liquidation`と`idx_perp_user_status`）
- **効果**: 清算チェックのバッチ処理が高速化され、リスク管理が向上

### 12.4 バッチ処理パフォーマンス考察

#### ポートフォリオスナップショット処理（1時間ごと）

- **処理量**: 全ユーザー（最大2,000人）×各ユーザーの保有トークン（平均5-10種類）
- **所要時間目標**: 5分以内
- **最適化戦略**:
  - ユーザーIDでのバッチ分割処理（100-200ユーザー単位）
  - スナップショット時の不要なJOINを回避
  - `user_timestamp_idx`複合インデックスによる検索最適化

#### 価格データ更新処理（10分ごと）

- **処理量**: 全トークン（20-30種類）
- **所要時間目標**: 30秒以内
- **最適化戦略**:
  - 個別のトークン価格更新をキューに入れて非同期処理
  - 外部API障害時のリトライ戦略
  - `idx_token_prices_updated`インデックスで最新価格を高速に特定

#### Funding Rate適用処理（8時間ごと）

- **処理量**: オープンポジション（数千件）
- **所要時間目標**: 3分以内
- **最適化戦略**:
  - `idx_perp_user_status`インデックスで対象ポジションを効率的に特定
  - トークンごとにバッチ処理を分割

### 12.5 スケーラビリティへの対応

現在の設計は以下の規模までスケールできると考えられます：

- **通常運用時**: 同時接続ユーザー数 ~500名、1日あたりトランザクション数 ~50,000件
- **プロモーション時ピーク**: 同時接続ユーザー数 ~1,000名、1日あたりトランザクション数 ~100,000件

現在の設計で対応可能な理由:

1. **効率的なインデックス設計**: 主要クエリパターンに合わせたインデックスの最適化
2. **データアーカイブ戦略**: `portfolio_snapshots`テーブルのデータ間引き処理による肥大化防止
3. **キャッシュ最適化**: ユーザー行動に基づく価格更新の優先度付け
4. **バッチ処理分散**: 重いバッチ処理の分散実行と最適なスケジュール設計

### 12.6 パフォーマンスボトルネック予測

予想されるボトルネックと対応策：

| ボトルネック                     | 発生予測       | 対応策                                                   |
| -------------------------------- | -------------- | -------------------------------------------------------- |
| ポートフォリオ表示の応答速度低下 | 同時接続増加時 | - Redis キャッシュの導入<br>- 重複クエリの結合           |
| スナップショット処理の遅延       | データ増加時   | - バッチサイズ調整<br>- 処理の並列化                     |
| トランザクション検索の遅延       | 履歴増加時     | - パーティショニングの検討<br>- 古いデータのアーカイブ化 |
| 価格データAPI制限                | 同時アクセス時 | - フォールバックソース導入<br>- 価格更新の優先順位付け   |

NeonDBはサーバーレスPostgreSQLのため、ワークロードに応じて自動的にスケールしますが、接続数制限やクエリ複雑性には注意が必要です。パフォーマンス監視を行い、必要に応じてインデックスやクエリの最適化を継続的に行います。

### 12.7 コスト分析（NeonDB）

αテスト期間中（2週間）のNeonDBのリソース使用量と費用見積もり:

#### リソース使用量予測

| リソース項目     | 予測使用量       | 算出根拠                                            |
| ---------------- | ---------------- | --------------------------------------------------- |
| ストレージ容量   | 3〜5 GB          | 主にportfolio_snapshotsとtransactionsテーブルの合計 |
| コンピュート時間 | 300〜400時間     | ピークタイム（10時間/日）×14日＋バッチ処理          |
| 同時接続数       | 最大200接続      | ピーク時の同時アクセスユーザー数                    |
| プロジェクト数   | 1〜3プロジェクト | 開発・テスト・本番環境                              |
| データ転送量     | 10〜15 GB/月     | API通信、レプリケーション、バックアップなど         |

#### プラン選択とコスト分析

αテスト期間中（2週間）の想定規模では、以下のプランが候補となります:

**1. Launch プラン ($19/月)**

- ✓ ストレージ: 10GB（十分）
- ✓ コンピュート時間: 300時間（ちょうど必要量）
- ✓ 同時接続数: 最大10,000（十分）
- ✓ プロジェクト数: 最大100（十分）
- ✓ オートスケーリング: 最大4CU（小〜中規模負荷向け）

**2. Scale プラン ($69/月)**

- ✓ ストレージ: 50GB（余裕あり）
- ✓ コンピュート時間: 750時間（余裕あり）
- ✓ 同時接続数: 最大10,000（十分）
- ✓ プロジェクト数: 最大1,000（余裕あり）
- ✓ オートスケーリング: 最大8CU（中〜大規模負荷向け）
- ✓ IP許可リスト: セキュリティ対策として有用

#### 結論と推奨

2週間のαテスト期間であれば、**Launch プラン ($19/月)**が最も費用対効果が高いと考えられます。

- **利点**: コスト効率が良く、基本的なリソース要件を満たす
- **考慮点**: コンピュート時間が上限に近いため、使用状況を監視する必要あり
- **対策**: 非アクティブ時のスケールゼロ機能を活用し、コンピュート時間を節約

テスト期間が延長される場合や、想定よりユーザー数/トランザクション数が増加する場合は、Scale プランへのアップグレードを検討してください。特に、高負荷テストやバッチ処理実行時の性能を重視する場合は、より大きなコンピュートユニット（CU）が有利になります。
