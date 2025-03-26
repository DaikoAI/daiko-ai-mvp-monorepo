# Basic Rules

- `Turborepo`, `pnpm`を用いたmonorepo構成を効果的に使用し、packageの切り分けや、型の共通化などを考えながらコードを書いて下さい
- `pnpm build`が通るようにして下さい
- packageにはapps以下のapplicationやその他のインフラやツールでもportableに使えるようなcore機能のpackageを提供し保守性の高いコード、アーキテクチャを保って下さい。

## Practices

- 小さく始めて段階的に拡張
- 過度な抽象化を避ける
- コードよりも型を重視
- 複雑さに応じてアプローチを調整

## Code Style

- 関数優先（クラスは必要な場合のみ）
- 不変更新パターンの活用
- 早期リターンで条件分岐をフラット化
- エラーとユースケースの列挙型定義

## Adapter Pattern

- 外部依存を抽象化
- インターフェースは呼び出し側で定義
- テスト時は容易に差し替え可能

## 実装手順

1. **型設計**

   - まず型を定義
   - ドメインの言語を型で表現

2. **純粋関数から実装**

   - 外部依存のない関数を先に
   - テストを先に書く

3. **副作用を分離**

   - IO操作は関数の境界に押し出す
   - 副作用を持つ処理をPromiseでラップ

4. **アダプター実装**
   - 外部サービスやDBへのアクセスを抽象化
   - テスト用モックを用意

## ディレクトリ構造

```zsh
.
├── README.md
├── apps
│   ├── news-scraper-job
│   ├── web
│   └── x-scraper-job
├── package.json
├── packages
│   ├── news-scraper
│   ├── shared
│   └── x-scraper
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── scripts
│   └── clean-packages.sh
└── turbo.json
```
