# News Scraper (Cron Job)

ニュースサイトを定期的にスクレイピングするためのcronジョブサービスです。

## 概要

このサービスは、登録されたニュースサイトから記事を自動的に収集し、データベースに保存します。Railway上でcronジョブとして実行されることを想定しています。

## 環境変数

以下の環境変数が必要です：

```
DATABASE_URL=postgresql://user:password@host:port/database
FIRECRAWL_API_KEY=your_api_key_here
```

## 開発環境での実行方法

1. 環境変数を設定

```bash
cp .env.example .env
# .envファイルを編集して正しい値を設定
```

2. 依存関係のインストール

```bash
npm install
```

3. 開発モードで実行

```bash
npm run dev
```

## Railway上での設定方法

1. Railwayプロジェクトを作成し、このディレクトリをソースとして設定します
2. 必要な環境変数を設定します（DATABASE_URL, FIRECRAWL_API_KEY）
3. Cronジョブの設定を行います:
   - 「Settings」>「Cron」を開く
   - スケジュールを設定（例: `0 */6 * * *` で6時間ごとに実行）

## 注意事項

- このサービスはmonorepoの一部として設計されており、`@daiko-ai/news-scraper`パッケージに依存しています
- 長時間実行されるタスクのため、十分なタイムアウト設定が必要です（推奨: 5分以上）
