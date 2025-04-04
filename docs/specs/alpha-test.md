# αテストシステム仕様書

## 1. 概要

本システムは、αテスト期間中にオフチェーン（DB）でcryptoアセットのトレード体験を再現し、AI Agentサービスの価値検証を行うための基盤となる。ユーザーは同一の初期ポートフォリオから始め、2週間の運用期間中に獲得したPnLを競い合う形式のコンペティションを実施する。

## 2. 使用技術

- **DB**: NeonDB (PostgreSQL)
- **ORM**: Drizzle
- **API**: Next.js API Routes with tRPC
- **フロントエンド**: Next.js

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

```typescript
interface User {
  id: string; // UUIDまたは自動採番
  username: string;
  // その他ユーザー情報
  email: string;
  wallet_address: string;
  total_asset_usd: number;
  crypto_investment_usd: number;
  trade_style: string;
  created_at: Date;
  updated_at: Date;
}
```

### `tokens` テーブル

```typescript
interface Token {
  address: string; // contract address
  symbol: string; // 例: "SOL", "USDC"
  name: string; // 例: "Solana", "USD Coin"
  decimals: number; // 小数点以下の桁数
  icon_url: string; // トークンのアイコンURL
  type: string; // トークンのタイプ "normal" | "lending" | "perp" | "liquid_staking"
  // 必要に応じて追加フィールド
}
```

### `user_balances` テーブル

```typescript
interface UserBalance {
  id: string;
  user_id: string; // usersテーブルへの外部キー
  token_address: string; // tokensテーブルへの外部キー
  balance: string; // 精度の高い数値型（文字列として保存）
  updated_at: Date;
}
```

### `transactions` テーブル

```typescript
type TransactionType = "swap" | "staking" | "liquid_staking" | "perp_trade" | "perp_close" | "lending";

interface Transaction {
  id: string;
  user_id: string; // usersテーブルへの外部キー
  transaction_type: TransactionType;
  from_token_address?: string; // スワップ元トークン（該当する場合）
  to_token_address?: string; // スワップ先トークン（該当する場合）
  amount_from?: string; // スワップ元数量
  amount_to?: string; // スワップ先数量
  fee?: string; // 取引手数料
  details: Record<string, any>; // 取引ルート、レート、その他動的パラメータ（JSON）
  created_at: Date;
}
```

### `investments` テーブル

```typescript
type InvestmentActionType = "staking" | "liquid_staking" | "lending";
type InvestmentStatus = "active" | "withdrawn";

interface Investment {
  id: string;
  user_id: string; // usersテーブルへの外部キー
  token_address: string; // 投資対象のトークン
  action_type: InvestmentActionType;
  principal: string; // 投資元本
  accrued_interest: string; // 累積利息
  start_date: Date; // 投資開始日
  last_update: Date; // 最終利息更新日
  interest_rate: number; // 利率
  status: InvestmentStatus; // 状態
}
```

### `perp_positions` テーブル

```typescript
type PositionDirection = "long" | "short";
type PositionStatus = "open" | "closed" | "liquidated";

interface PerpPosition {
  id: string;
  user_id: string; // usersテーブルへの外部キー
  token_address: string; // 対象トークン
  position_direction: PositionDirection; // ポジション方向
  leverage: number; // 例: 5 (5倍レバレッジ)
  entry_price: string; // エントリー時の価格
  position_size: string; // ポジションサイズ
  collateral_amount: string; // 証拠金として投入された量
  liquidation_price: string; // 清算価格
  entry_funding_rate: number; // エントリー時のFunding Rate
  accumulated_funding: string; // 累積Funding調整額
  funding_rate_last_applied: Date; // 前回Funding Rate適用日時
  status: PositionStatus; // ポジション状態
  created_at: Date;
  updated_at: Date;
}
```

### (オプション) `interest_rates` テーブル

```typescript
interface InterestRate {
  id: string;
  token_address: string; // tokensテーブルへの外部キー
  action_type: InvestmentActionType;
  interest_rate: number; // 利率
  effective_date: Date; // 適用開始日時
}
```

### (オプション) `funding_rates` テーブル

```typescript
interface FundingRate {
  id: string;
  token_address: string; // 対象トークン
  rate: number; // Funding Rate値
  timestamp: Date; // 適用時刻
}
```

## 5. 主要な処理フロー

### 1. 初期ポートフォリオ配布

- αテスト開始時、全ユーザーに同一の初期ポートフォリオを`user_balances`に登録

### 2. トークンのステーキング

```typescript
// ユーザーがトークンをステークする処理の概要
function stakeToken(userId: string, tokenId: string, amount: string, interestRate: number) {
  // user_balancesからamount分を減少
  // investmentsテーブルに新規レコード作成
  // transactionsテーブルに履歴登録
}

// 日次バッチで利息を付与
function applyDailyInterest() {
  // 全アクティブなinvestmentsレコードを取得
  // 日次利息を計算し、accrued_interestを更新
  // last_updateを現在時刻に更新
}
```

### 3. トークンのスワップ（1:1）

```typescript
function swapToken(userId: string, fromTokenId: string, toTokenId: string, amount: string) {
  // 市場レートを取得
  // user_balancesの更新（fromTokenを減少、toTokenを増加）
  // transactionsテーブルに履歴登録
}
```

### 4. Liquid Staking

```typescript
function liquidStake(userId: string, tokenId: string, lstTokenId: string, amount: string) {
  // user_balancesからtokenIdを減少
  // user_balancesにlstTokenIdを増加
  // investmentsテーブルに新規レコード作成
  // transactionsテーブルに履歴登録
}

// 日次バッチでLSTの価値増加を適用
function applyLSTValueIncrease() {
  // 全アクティブなliquid_stakingのinvestmentsレコードを取得
  // 価値増加分を計算しaccrued_interestを更新
  // 対応するLSTのuser_balancesも適宜更新
}
```

### 5. Perp Trade（成り行き注文）

```typescript
// ポジションの開設
function openPerpPosition(
  userId: string,
  tokenId: string,
  collateralAmount: string,
  leverage: number,
  direction: "long" | "short",
) {
  // 現在の市場価格を取得
  // ポジションサイズと清算価格を計算
  // user_balancesから証拠金を減少
  // perp_positionsに新規レコード作成
  // transactionsテーブルに履歴登録
}

// 定期的なFunding Rate適用と清算チェック
function updatePerpPositions() {
  // 全てのオープンポジションを取得
  // 各ポジションについて:
  // 市場価格と清算価格を比較、必要なら清算処理
  // Funding Rate調整の適用
  // 更新情報の保存
}

// ポジション決済
function closePerpPosition(positionId: string) {
  // ポジション情報と現在市場価格を取得
  // PnL、Funding調整額、手数料を計算
  // 最終的な返還額を算出しuser_balancesを更新
  // ポジションのステータスを'closed'に更新
  // transactionsテーブルに履歴登録
}
```

### 6. ユーザーポートフォリオの時価評価

```typescript
function getUserPortfolio(userId: string) {
  // user_balancesから全保有トークンを取得
  // 各トークンの現在市場価格を外部APIから取得
  // 各トークンの時価評価額を計算
  // オープンなperp_positionsがあればその含み損益も計算
  // 合計ポートフォリオ価値と、トークン別の内訳を返却
}
```

## 6. 実装スケジュール

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

## 7. 技術的考慮事項

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

## 8. トークン価格管理

### 価格取得ソース

- Jupiter APIを使用: `https://api.jup.ag/price/v2?ids=${token_address}`
- 定期的（10分間隔を推奨）に価格データを取得しキャッシュ

### `token_prices` テーブル

```typescript
interface TokenPrice {
  id: string;
  token_id: string; // tokensテーブルへの外部キー
  price_usd: string; // USD価格（文字列として保存）
  last_updated: Date; // 価格更新時刻
  source: string; // 価格取得ソース（"jupiter"など）
}
```

### 価格更新処理

```typescript
// 定期的な価格更新バッチ処理
async function updateTokenPrices() {
  // すべてのトークンアドレスを取得
  const tokens = await db.tokens.findMany();

  // Jupiter APIから価格を取得
  const tokenAddresses = tokens.map((token) => token.contract_address);
  const pricesResponse = await fetch(`https://api.jup.ag/price/v2?ids=${tokenAddresses.join(",")}`);
  const pricesData = await pricesResponse.json();

  // 各トークンの価格を更新
  for (const token of tokens) {
    await db.tokenPrices.upsert({
      where: { token_id: token.id },
      update: {
        price_usd: pricesData[token.contract_address]?.toString() || "0",
        last_updated: new Date(),
        source: "jupiter",
      },
      create: {
        token_id: token.id,
        price_usd: pricesData[token.contract_address]?.toString() || "0",
        last_updated: new Date(),
        source: "jupiter",
      },
    });
  }
}
```

## 9. API設計

### ユーザーポートフォリオAPI

```typescript
// GET /api/portfolio/:wallet_address
async function getUserPortfolio(walletAddress: string) {
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

  // 最新のトークン価格を取得
  const tokenIds = balances.map((balance) => balance.token_id);
  const prices = await db.tokenPrices.findMany({
    where: { token_id: { in: tokenIds } },
  });

  // 価格マップを作成
  const priceMap = prices.reduce((map, price) => {
    map[price.token_id] = price.price_usd;
    return map;
  }, {});

  // ポートフォリオデータを構築
  const portfolio = balances.map((balance) => {
    const tokenPrice = priceMap[balance.token_id] || "0";
    const valueUsd = new BigNumber(balance.balance).multipliedBy(tokenPrice).toString();

    return {
      token: balance.token.symbol,
      token_address: balance.token.contract_address,
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
  for (const position of perpPositions) {
    const currentPrice = priceMap[position.token_id] || "0";
    // PnL計算ロジック...
    // portfolioに追加
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
    perp_positions: perpPositionsData || [],
  };
}
```

### トークン価格API

```typescript
// GET /api/prices?tokens=token1,token2,...
async function getTokenPrices(tokenAddresses: string[]) {
  // DBからキャッシュされた価格を取得
  const prices = await db.tokenPrices.findMany({
    where: {
      token: {
        contract_address: { in: tokenAddresses },
      },
    },
    include: { token: true },
  });

  // 各トークンの価格データを構築
  const priceData = prices.map((price) => ({
    token_address: price.token.contract_address,
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

## 10. フロントエンド連携

フロントエンドでは以下の方法でデータを取得・表示します：

1. ユーザーのウォレット接続時に、ウォレットアドレスをバックエンドに送信
2. `/api/portfolio/:wallet_address` エンドポイントから完全なポートフォリオデータを取得
3. ポートフォリオ画面で各トークンの残高、USD価値、合計価値を表示
4. 定期的（30秒〜1分間隔）に最新データを取得し表示を更新

リアルタイム性が重要な場合は、WebSocketを使用したpush通知も検討可能です。

## 11. 課題と制限事項

- αテスト環境では実際のオンチェーンデータとの連携は最小限とし、主にDB内シミュレーションに注力
- 市場価格データはJupiter APIから定期的に取得し、実際の市場状況を反映
- 高度なトレーディング機能（指値注文、複雑なポジション管理など）は初期フェーズでは実装しない
- Jupiter APIの利用制限に注意し、適切なエラーハンドリングとフォールバック戦略を実装する
