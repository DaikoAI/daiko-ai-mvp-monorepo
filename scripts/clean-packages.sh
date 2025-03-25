#!/bin/bash

# パッケージディレクトリの配列
PACKAGES=(
    "packages/client"
    "packages/shared"
    "packages/news-scraper"
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
