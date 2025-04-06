FROM node:18-alpine

WORKDIR /app

# パッケージ管理ツールのインストール
RUN npm install -g pnpm@8.15.3

# 依存関係のコピーとインストール
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ソースコードのコピー
COPY . .

# アプリケーションのビルド
RUN pnpm build

# デフォルトでCRON実行モードを有効にする
ENV NODE_ENV=production
ENV PRICE_UPDATE_CRON="*/10 * * * *"

# アプリケーションの実行
ENTRYPOINT ["node", "dist/index.js"]
CMD ["--cron"]