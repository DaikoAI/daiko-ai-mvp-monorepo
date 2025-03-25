# X Scraper

Expressjs を使用して X (旧 Twitter) アカウントの投稿をスクレイピングし、仮想通貨関連の投稿を検出するサーバーです。

## 機能

- 登録された X アカウントの定期的なスクレイピング
- 新規投稿の検出
- OpenAI API を使用した仮想通貨関連コンテンツの分析
- ユーザーへの通知機能

## セットアップ手順

### 必要条件

- Node.js と pnpm がインストールされていること
- Cloud Firestore データベース
- OpenAI API キー

### インストール

1. 依存関係をインストール

```bash
pnpm install
```

2. 環境変数の設定
   `.env.sample` ファイルを `.env` にコピーし、必要な値を設定します：

```bash
PORT=3000
NODE_ENV=development
OPENAI_API_KEY=your-openai-api-key
CHECK_INTERVAL_MINUTES=30
FIREBASE_DATABASE_URL=your-firebase-database-url
```

### デプロイ

#### ローカル開発

```bash
# 開発サーバーの起動
pnpm run dev

# 本番ビルド
pnpm run build

# 本番サーバーの起動
pnpm start
```

#### Railway へのデプロイ

1. Railway CLI のインストール

```bash
npm i -g @railway/cli
```

2. Railway へのログイン

```bash
railway login
```

3. プロジェクトの初期化

```bash
railway init
```

4. 環境変数の設定

```bash
railway variables set MONGODB_URI=<your-mongodb-uri>
railway variables set OPENAI_API_KEY=<your-openai-api-key>
railway variables set NODE_ENV=production
```

6. デプロイ

```bash
railway up
```

## API エンドポイント

- **GET `/`**: サーバーのステータスを確認
- **GET `/check`**: 登録されたすべての X アカウントをチェック
- **POST `/check-account`**: 特定の X アカウントをチェック
  - リクエスト本文: `{ "xId": "アカウント名" }`
- **POST `/add-account`**: 監視対象アカウントを追加
  - リクエスト本文: `{ "xId": "アカウント名", "userId": "通知先ユーザーID" }`

## API のテスト

```bash
# アカウントの追加
curl -X POST http://localhost:3000/add-account \
  -H "Content-Type: application/json" \
  -d '{"xId": "elonmusk", "userId": "test-user"}'

# 単一アカウントのチェック
curl -X POST http://localhost:3000/check-account \
  -H "Content-Type: application/json" \
  -d '{"xId": "elonmusk"}'

# 全アカウントのチェック
curl http://localhost:3000/check
```

## スクレイピングの技術的制約と注意点

### X のスクレイピングの難しさ

X (旧 Twitter) はスクレイピングを困難にするいくつかの特徴があります：

1. **動的コンテンツ**: X のウェブページは JavaScript で動的に生成されるため、通常の HTTP request だけでは完全なコンテンツを取得できない場合があります。

2. **レート制限**: 短時間に多数のリクエストを送信すると、IP アドレスがブロックされる可能性があります。

3. **HTML 構造の変更**: X 側で HTML の構造が頻繁に変更されるため、抽出ロジックが突然機能しなくなる可能性があります。

4. **アクセス制限**: ログインが必要なコンテンツや非公開アカウントの情報は取得できません。

### トラブルシューティング

抽出がうまくいかない場合の対処法：

1. **User-Agent の変更**: ブラウザのような`User-Agent`ヘッダーを使用することで、サーバーからより完全な HTML を受け取れる場合があります。

2. **抽出ロジックの更新**: `extractTweetsFromHTML`メソッドは定期的に更新が必要になります。HTML の変更に応じて正規表現パターンを調整してください。

3. **デバッグ出力の確認**: ログファイル（error.log, combined.log）を確認し、HTML の取得状況や抽出結果を確認してください。

4. **フォールバック戦略**: 主要な抽出方法が失敗した場合に備えて、複数の抽出方法を用意しています。それでも失敗する場合は、より汎用的な方法を試してください。

## 注意事項

- 実際の X (Twitter) の HTML 構造が変更された場合、スクレイピングロジックを更新する必要があります。
- OpenAI API の利用にはコストがかかります。API キーの利用制限を設定することをおすすめします。
- 通知機能は外部の Webhook サービスなどと連携して実装する必要があります。
- **免責事項**: X (Twitter)の利用規約では、一部のスクレイピングが禁止されている場合があります。利用にあたっては自己責任でお願いします。
