# Token Price Update Batch Job

Jupiterの価格APIを使用して、DBに登録されているトークンの価格情報を定期的に更新するバッチジョブです。

## 機能

- Jupiterの価格API (`https://api.jup.ag/price/v2`) を使用してトークン価格を取得
- 取得した価格をデータベースに保存
- 定期的な実行（デフォルト：10分ごと）またはワンタイム実行
- 特定のトークンの価格だけを取得することも可能

## 実行方法

### ローカル開発環境での実行 (monorepo利用)

```bash
# ワンタイム実行モード（すべてのトークン価格を1回更新）
pnpm run job:token-price

# CRON実行モード（バックグラウンドで定期的に実行）
pnpm run job:token-price:cron

# 特定のトークンの価格のみを取得
cd apps/token-price-job
pnpm run dev -- --token=<トークンアドレス>
```

### 個別実行（アプリディレクトリ内）

```bash
# ディレクトリに移動
cd apps/token-price-job

# 依存関係をインストール
pnpm install

# 開発モード（ワンタイム実行）
pnpm run dev

# CRONモード（バックグラウンドで定期実行）
pnpm run dev:cron

# 特定のトークンの価格のみを取得
pnpm run dev -- --token=<トークンアドレス>
```

## 使い方

### 環境変数の設定

`.env`ファイルを作成し、以下の環境変数を設定します：

```
DATABASE_URL="postgres://..."
PRICE_UPDATE_CRON="*/10 * * * *"
JUPITER_API_URL="https://api.jup.ag/price/v2"
```

- `DATABASE_URL`: データベース接続文字列
- `PRICE_UPDATE_CRON`: 価格更新の実行スケジュール（cron形式）
- `JUPITER_API_URL`: JupiterのAPI URL

## デプロイ方法

### AWS Lambda へのデプロイ

1. Lambda関数を作成
2. 環境変数を設定
3. デプロイパッケージを準備：

```bash
pnpm build
cd dist
zip -r ../function.zip .
```

4. CloudWatch Eventsで定期実行を設定

### AWS ECS/Fargate へのデプロイ

Dockerfileを使用して、コンテナとして実行することも可能です：

```bash
# イメージをビルド
docker build -t token-price-job .

# コンテナを実行（ワンタイム実行）
docker run --env-file .env token-price-job

# コンテナを実行（CRON実行モード）
docker run --env-file .env token-price-job --cron
```

### Vercel Cron Jobs へのデプロイ

Vercel Cron Jobsを使用する場合は、`vercel.json`に以下のように設定します：

```json
{
  "crons": [
    {
      "path": "/api/update-token-prices",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

そして、Next.jsアプリケーション内に対応するAPIエンドポイントを作成します。
