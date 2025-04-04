# αテストシステム仕様書

## 1. 概要

本システムは、αテスト期間中にオフチェーン（DB）でcryptoアセットのトレード体験を再現し、AI Agentサービスの価値検証を行うための基盤となる。ユーザーは同一の初期ポートフォリオから始め、2週間の運用期間中に獲得したPnLを競い合う形式のコンペティションを実施する。

## 2. 使用技術

- **DB**: [NeonDB](https://neon.tech/) (PostgreSQL)
- **ORM**: [Drizzle](https://drizzle.dev/)
- **API**: Next.js API Routes with [tRPC](https://trpc.io/)
- **フロントエンド**: [Next.js](https://nextjs.org/)

## 3. ユースケース

### 初期フェーズ（リリース時）

- ユーザーが自分のトークンをステーキングし、日次の利回りを獲得する
- トークンを1:1でスワップする
- ユーザーがトークンをLiquid Stake Poolにステークし、LSTを獲得。LSTは規定の利回りで価値が増加する

### 拡張フェーズ（1週間後）

- Perp Trade（レバレッジ付き、成り行き注文のみ）の実装
- Funding Rateの適用と日次調整
- ポジションの清算ロジックと処理の実装

## 4. データベース設計

### `users` テーブル

| カラム名              | データ型      | 制約                  | 説明                  |
| --------------------- | ------------- | --------------------- | --------------------- |
| id                    | UUID          | PRIMARY KEY           | ユーザーID            |
| username              | VARCHAR(255)  | NOT NULL              | ユーザー名            |
| email                 | VARCHAR(255)  | UNIQUE                | メールアドレス        |
| wallet_address        | VARCHAR(255)  | UNIQUE, NOT NULL      | ウォレットアドレス    |
| total_asset_usd       | DECIMAL(20,8) | DEFAULT 0             | 総資産額（USD）       |
| crypto_investment_usd | DECIMAL(20,8) | DEFAULT 0             | 仮想通貨投資額（USD） |
| trade_style           | VARCHAR(50)   |                       | トレードスタイル      |
| created_at            | TIMESTAMP     | NOT NULL, DEFAULT NOW | 作成日時              |
| updated_at            | TIMESTAMP     | NOT NULL, DEFAULT NOW | 更新日時              |

### `tokens` テーブル

| カラム名 | データ型     | 制約        | 説明                                                 |
| -------- | ------------ | ----------- | ---------------------------------------------------- |
| address  | VARCHAR(255) | PRIMARY KEY | コントラクトアドレス                                 |
| symbol   | VARCHAR(20)  | NOT NULL    | トークンシンボル                                     |
| name     | VARCHAR(255) | NOT NULL    | トークン名                                           |
| decimals | INTEGER      | NOT NULL    | 小数点以下の桁数                                     |
| icon_url | VARCHAR(512) |             | アイコンURL                                          |
| type     | VARCHAR(50)  | NOT NULL    | トークンタイプ（normal/lending/perp/liquid_staking） |

### `user_balances` テーブル

| カラム名      | データ型     | 制約                                             | 説明             |
| ------------- | ------------ | ------------------------------------------------ | ---------------- |
| id            | UUID         | PRIMARY KEY                                      | ID               |
| user_id       | UUID         | NOT NULL, FOREIGN KEY REFERENCES users(id)       | ユーザーID       |
| token_address | VARCHAR(255) | NOT NULL, FOREIGN KEY REFERENCES tokens(address) | トークンアドレス |
| balance       | VARCHAR(78)  | NOT NULL, DEFAULT '0'                            | 残高（文字列型） |
| updated_at    | TIMESTAMP    | NOT NULL, DEFAULT NOW                            | 更新日時         |

### `transactions` テーブル

| カラム名           | データ型     | 制約                                       | 説明               |
| ------------------ | ------------ | ------------------------------------------ | ------------------ |
| id                 | UUID         | PRIMARY KEY                                | トランザクションID |
| user_id            | UUID         | NOT NULL, FOREIGN KEY REFERENCES users(id) | ユーザーID         |
| transaction_type   | VARCHAR(50)  | NOT NULL                                   | 取引タイプ         |
| from_token_address | VARCHAR(255) | FOREIGN KEY REFERENCES tokens(address)     | 送信元トークン     |
| to_token_address   | VARCHAR(255) | FOREIGN KEY REFERENCES tokens(address)     | 送信先トークン     |
| amount_from        | VARCHAR(78)  |                                            | 送信元数量         |
| amount_to          | VARCHAR(78)  |                                            | 送信先数量         |
| fee                | VARCHAR(78)  |                                            | 手数料             |
| details            | JSONB        |                                            | 詳細情報（JSON）   |
| created_at         | TIMESTAMP    | NOT NULL, DEFAULT NOW                      | 作成日時           |

### `investments` テーブル

| カラム名         | データ型      | 制約                                             | 説明                                         |
| ---------------- | ------------- | ------------------------------------------------ | -------------------------------------------- |
| id               | UUID          | PRIMARY KEY                                      | 投資ID                                       |
| user_id          | UUID          | NOT NULL, FOREIGN KEY REFERENCES users(id)       | ユーザーID                                   |
| token_address    | VARCHAR(255)  | NOT NULL, FOREIGN KEY REFERENCES tokens(address) | トークンアドレス                             |
| action_type      | VARCHAR(50)   | NOT NULL                                         | 投資タイプ（staking/liquid_staking/lending） |
| principal        | VARCHAR(78)   | NOT NULL                                         | 元本                                         |
| accrued_interest | VARCHAR(78)   | NOT NULL, DEFAULT '0'                            | 累積利息                                     |
| start_date       | TIMESTAMP     | NOT NULL                                         | 開始日時                                     |
| last_update      | TIMESTAMP     | NOT NULL                                         | 最終更新日時                                 |
| interest_rate    | DECIMAL(10,5) | NOT NULL                                         | 利率（%）                                    |
| status           | VARCHAR(20)   | NOT NULL                                         | ステータス（active/withdrawn）               |

### `perp_positions` テーブル

| カラム名                  | データ型      | 制約                                             | 説明                                 |
| ------------------------- | ------------- | ------------------------------------------------ | ------------------------------------ |
| id                        | UUID          | PRIMARY KEY                                      | ポジションID                         |
| user_id                   | UUID          | NOT NULL, FOREIGN KEY REFERENCES users(id)       | ユーザーID                           |
| token_address             | VARCHAR(255)  | NOT NULL, FOREIGN KEY REFERENCES tokens(address) | トークンアドレス                     |
| position_direction        | VARCHAR(10)   | NOT NULL                                         | ポジション方向（long/short）         |
| leverage                  | INTEGER       | NOT NULL                                         | レバレッジ倍率                       |
| entry_price               | VARCHAR(78)   | NOT NULL                                         | エントリー価格                       |
| position_size             | VARCHAR(78)   | NOT NULL                                         | ポジションサイズ                     |
| collateral_amount         | VARCHAR(78)   | NOT NULL                                         | 証拠金額                             |
| liquidation_price         | VARCHAR(78)   | NOT NULL                                         | 清算価格                             |
| entry_funding_rate        | DECIMAL(10,5) | NOT NULL                                         | エントリー時Funding Rate             |
| accumulated_funding       | VARCHAR(78)   | NOT NULL, DEFAULT '0'                            | 累積Funding調整額                    |
| funding_rate_last_applied | TIMESTAMP     | NOT NULL                                         | Funding Rate最終適用時刻             |
| status                    | VARCHAR(20)   | NOT NULL                                         | ステータス（open/closed/liquidated） |
| created_at                | TIMESTAMP     | NOT NULL, DEFAULT NOW                            | 作成日時                             |
| updated_at                | TIMESTAMP     | NOT NULL, DEFAULT NOW                            | 更新日時                             |

### `token_prices` テーブル

| カラム名      | データ型     | 制約                                             | 説明             |
| ------------- | ------------ | ------------------------------------------------ | ---------------- |
| id            | UUID         | PRIMARY KEY                                      | ID               |
| token_address | VARCHAR(255) | NOT NULL, FOREIGN KEY REFERENCES tokens(address) | トークンアドレス |
| price_usd     | VARCHAR(78)  | NOT NULL                                         | USD価格          |
| last_updated  | TIMESTAMP    | NOT NULL                                         | 最終更新時刻     |
| source        | VARCHAR(50)  | NOT NULL                                         | 価格取得ソース   |

### (オプション) `interest_rates` テーブル

| カラム名       | データ型      | 制約                                             | 説明             |
| -------------- | ------------- | ------------------------------------------------ | ---------------- |
| id             | UUID          | PRIMARY KEY                                      | ID               |
| token_address  | VARCHAR(255)  | NOT NULL, FOREIGN KEY REFERENCES tokens(address) | トークンアドレス |
| action_type    | VARCHAR(50)   | NOT NULL                                         | アクションタイプ |
| interest_rate  | DECIMAL(10,5) | NOT NULL                                         | 利率（%）        |
| effective_date | TIMESTAMP     | NOT NULL                                         | 有効日           |

### (オプション) `funding_rates` テーブル

| カラム名      | データ型      | 制約                                             | 説明             |
| ------------- | ------------- | ------------------------------------------------ | ---------------- |
| id            | UUID          | PRIMARY KEY                                      | ID               |
| token_address | VARCHAR(255)  | NOT NULL, FOREIGN KEY REFERENCES tokens(address) | トークンアドレス |
| rate          | DECIMAL(10,5) | NOT NULL                                         | Funding Rate     |
| timestamp     | TIMESTAMP     | NOT NULL                                         | 適用時刻         |

## 5. API設計

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

## 6. バッチジョブと処理フロー

### 1. 初期ポートフォリオ配布

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

### 2. トークン価格更新処理

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

### 3. 日次利息適用処理

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

### 4. Funding Rate適用処理

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

### 5. ポジション清算チェック処理

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

## 7. フロントエンド連携

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

## 8. 実装スケジュール

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
