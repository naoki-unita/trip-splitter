# 旅費わりかん (Trip Splitter)

友人との旅行費用をその場(セッション内)で精算するためのWebアプリです。DBは使わず、ブラウザの `sessionStorage` にデータを保持します(タブを閉じると消えます)。

## 主な機能

- 参加者の追加・削除
- 支払いの記録(誰が / いくら / 何に / 誰と割り勘するか)
- 精算額の自動計算(送金回数が最小になるように最適化)
- 複数通貨対応(海外旅行向け。リアルタイム為替レートで自動換算)

## 技術スタック

- Next.js 14 (App Router) / TypeScript
- TailwindCSS
- Docker (multi-stage build, `next.js standalone` 出力)
- `exchangerate.host` を使いたい場合は `.env.local` に `NEXT_PUBLIC_EXCHANGE_API_KEY` を設定すると自動的にそちらが優先されます

## セットアップ (ローカル)

```bash
npm install
cp .env.example .env.local
# .env.local に NEXT_PUBLIC_EXCHANGE_API_KEY=xxxx を設定してから
npm run dev
# http://localhost:3000
```

Node.js 18以上を推奨(このプロジェクトはNode 20系で動作確認済み)。

## セットアップ (Docker)

```bash
docker compose up --build
# http://localhost:3000
```

exchangerate.host のAPIキーを使う場合:

```bash
cp .env.example .env
# .env に NEXT_PUBLIC_EXCHANGE_API_KEY=xxxx を設定してから
docker compose up --build
```

## ディレクトリ構成

```
src/
  app/                # ルーティング (App Router)
  components/         # UIコンポーネント(状態を持たない or Contextを消費するだけ)
  context/TripContext.tsx  # セッション内state管理 (useReducer)
  lib/
    types.ts          # ドメイン型
    calculations.ts   # 割り勘・精算アルゴリズム(純粋関数、UIに依存しない)
    currency.ts        # 為替レート取得・換算
```

ロジック(`lib/`)とUI(`components/`)を分離している。
