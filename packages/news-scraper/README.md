# News Scraper

Firecrawl を使用してユーザーがキュレーションしたニュースサイトを定期的にクロールし、Firebase に保存する Express サーバーです。

## 機能

- ユーザーごとのニュースサイト URL 管理
- Firecrawl を使用した効率的なクローリング
- Firebase へのデータ保存
- RESTful API エンドポイント

## セットアップ手順

### 必要条件

- Node.js と pnpm がインストールされていること
- Firebase プロジェクト
- Firecrawl API キー

### インストール

1. 依存関係をインストール

```bash
pnpm install
```

2. 環境変数の設定
   `.env.example`をコピーして`.env`を作成し、必要な値を設定します：

```bash
cp .env.example .env
```

必要な環境変数：

- `PORT`: サーバーのポート番号（デフォルト: 3000）
- `FIREBASE_PROJECT_ID`: Firebase プロジェクトの id
- `FIREBASE_PRIVATE_KEY`: Firebase 秘密鍵
- `FIREBASE_CLIENT_EMAIL`: Firebase クライアントメール
- `FIRECRAWL_API_KEY`: Firecrawl API キー

### 開発サーバーの起動

```bash
pnpm dev
```

### 本番環境用ビルドと実行

```bash
pnpm build
pnpm start
```

## API エンドポイント

- **POST `/sites`**: ニュースサイトを追加
  - リクエスト本文: `{ "url": "https://coinpost.jp", "userId": "test-user" }`
- **GET `/sites`**: ユーザーのニュースサイト一覧を取得
  - クエリパラメータ: `userId`
- **POST `/sites/:siteId/scrape`**: 特定のサイトの手動クロールを実行
- **POST `/scrape/scheduled`**: すべてのサイトのクロールを実行

## API のテスト

```bash
# サイトの追加
curl -X POST http://localhost:3000/sites \
  -H "Content-Type: application/json" \
  -d '{"url": "https://coinpost.jp", "userId": "test-user"}'

# ユーザーのサイト一覧取得
curl "http://localhost:3000/sites?userId=test-user"

# 特定のサイトのクロール実行
curl -X POST http://localhost:3000/sites/site123/scrape

# スケジュールされたクロール実行
curl -X POST http://localhost:3000/scrape/scheduled
```

## Railway へのデプロイ

1. GitHub リポジトリを Railway に連携

2. 環境変数の設定
   Railway のダッシュボードで必要な環境変数を設定

3. デプロイ
   main ブランチへのプッシュで自動的にデプロイされます

## 開発時の注意点

### クロールの制限

1. **レート制限**: 短時間に多数のリクエストを送信すると、対象サイトからブロックされる可能性があります。

2. **データ量**: クロール結果のデータサイズが大きくなりすぎないように注意してください。

### トラブルシューティング

1. **クロール失敗時**:

   - Firecrawl API キーの確認
   - 対象サイトのロボット規約の確認
   - エラーログの確認

2. **Firebase 接続エラー**:
   - 認証情報の確認
   - プロジェクト ID の設定確認
   - Firebase ルールの確認

## 注意事項

- クロール対象のサイトのロボット規約を必ず確認してください。
- 個人情報や機密情報を含むページはクロールしないでください。
- Firebase の料金プランに注意してください。
