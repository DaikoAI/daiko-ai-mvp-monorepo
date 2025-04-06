# Token Price Update Batch Job

Jupiterの価格APIを使用して、DBに登録されているトークンの価格情報を定期的に更新するバッチジョブです。

## 機能

- Jupiterの価格API (`https://api.jup.ag/price/v2`) を使用してトークン価格を取得
- 取得した価格をデータベースに保存
- 定期的な実行（デフォルト：10分ごと）またはワンタイム実行
- 特定のトークンの価格だけを取得することも可能

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

### ローカルでの実行

**ワンタイム実行：**

```bash
# 開発モード
pnpm dev

# ビルド後の実行
pnpm build
pnpm start
```

**CRON実行モード：**

```bash
# 開発モード
pnpm dev -- --cron

# ビルド後の実行
pnpm build
pnpm start -- --cron
```

**特定のトークンの価格のみを取得：**

```bash
# 開発モード
pnpm dev -- --token=6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN

# ビルド後の実行
pnpm build
pnpm start -- --token=6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN
```

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
