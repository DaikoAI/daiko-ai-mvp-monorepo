FROM node:20-slim

# Install Chrome, ChromeDriver, and dependencies
RUN apt-get update && apt-get install -y \
	wget \
	gnupg \
	ca-certificates \
	procps \
	chromium \
	chromium-driver \
	fonts-ipafont-gothic \
	fonts-wqy-zenhei \
	fonts-thai-tlwg \
	fonts-kacst \
	fonts-symbola \
	fonts-noto \
	fonts-freefont-ttf \
	&& rm -rf /var/lib/apt/lists/*

# Set environment variables for Chrome/Selenium
ENV CHROME_BIN=/usr/bin/chromium
ENV CHROME_PATH=/usr/lib/chromium/
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Create app directory
WORKDIR /app

# Turborepoなどを利用していると仮定して、必要なファイルをコピー
COPY package.json ./
COPY tsconfig.json ./

# monorepoのルートからのコピーに変更
COPY . .

# 依存関係をインストール
RUN npm install

# アプリケーションをビルド
RUN npm run build

# アプリケーションを起動
CMD ["npm", "start"]