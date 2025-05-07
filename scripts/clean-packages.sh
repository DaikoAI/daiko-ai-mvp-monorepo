#!/bin/bash

# パッケージディレクトリの配列
PACKAGES=(
    "apps/news-scraper-job"
    "apps/x-scraper-job"
    "apps/web"
    "apps/lp"
    "apps/selenium-worker"
    "packages/proposal-generator"
    "packages/shared"
    "packages/news-scraper"
    "packages/farcaster-scraper"
    "packages/token-price-fetcher"
    "packages/x-scraper"
)

# 各パッケージディレクトリで削除を実行
for package in "${PACKAGES[@]}"; do
    echo "Cleaning ${package}..."
    rm -rf "${package}/node_modules"
    rm -rf "${package}/.turbo"
    rm -rf "${package}/dist"
    rm -rf "${package}/.next"
done

# ルートディレクトリのクリーンアップ
echo "Cleaning root directory..."
rm -rf node_modules
rm -rf .turbo

echo "All packages cleaned successfully!"
