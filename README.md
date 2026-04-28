# 米国株まとめサイト (us-stocks-app) — ローカル動作版

SEC EDGAR 主軸の米国株情報サイト MVP。
日本人個人投資家向けに、米国株のフィリング (10-K/10-Q/8-K 等) を日本語で読めるように構築。

## 構成

- **Next.js 16 (App Router) + TypeScript + Tailwind v4** — 単体で `npm run dev` 起動
- **データソース**:
  - フィリング: SEC EDGAR API（無料・キー不要・User-Agent必須）
  - 株価/出来高/時価総額: Polygon.io API（無料プラン: 5 calls/min, EOD）
- **株価チャート**: TradingView 埋め込みウィジェット（15分遅延・商用OK）
- **翻訳**: 採用しない（Chrome / Edge の自動翻訳を利用）
- **キャッシュ**: ファイルベース (`data/cache/`)。PV集計も同階層に蓄積。Supabase は Phase 2 で導入予定

## セットアップ

```bash
cd c:/claudecompany/開発/us-stocks-app
npm install
cp .env.local.example .env.local   # Windowsなら copy .env.local.example .env.local
# .env.local の POLYGON_API_KEY を実キーに差し替え
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

## Polygon.io API キー取得

1. https://polygon.io/dashboard にアクセスして無料プランで登録
2. ダッシュボードで API キーをコピー
3. `.env.local` の `POLYGON_API_KEY` に貼り付け

無料プラン制約: 5 calls/min, 前営業日終値 (EOD) のみ。
ランキングのデータはローカルに 24h キャッシュされるため、初回取得後は API 呼び出しが発生しない。

## 動作確認シナリオ

- `/` ホーム → 検索ボックスに `AAPL` を入力 → サジェスト表示
- `/stock/AAPL` 銘柄詳細 → TradingViewチャート + フィリング一覧（訪問でPV計上）
- フィリング詳細 → 「SEC EDGAR で原文を開く」→ ブラウザの自動翻訳で読む
- `/rankings` → 出来高 / 売買代金 / 時価総額 / セクター騰落 / PV人気 を切替表示

## ディレクトリ構成

```
us-stocks-app/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── search/page.tsx
│   ├── rankings/page.tsx
│   ├── stock/[ticker]/page.tsx
│   ├── stock/[ticker]/filings/page.tsx
│   ├── stock/[ticker]/filings/[accessionNo]/page.tsx
│   └── api/
│       ├── search/route.ts
│       ├── company/[cik]/route.ts
│       ├── filings/[cik]/route.ts
│       ├── pv/route.ts
│       └── rankings/[type]/route.ts
├── components/
│   ├── StockSearch.tsx
│   ├── TradingViewChart.tsx
│   ├── FilingList.tsx
│   └── PvTracker.tsx
├── lib/
│   ├── edgar/{client.ts, types.ts}
│   ├── polygon/client.ts
│   ├── pv/tracker.ts
│   ├── rankings/{compute.ts, seed.ts}
│   ├── cache/fileCache.ts
│   └── utils.ts
├── data/cache/      # 実行時に生成されるキャッシュJSON群（gitignore）
├── .env.local       # 実キー（gitignore）
├── .env.local.example
├── next.config.ts, tsconfig.json, postcss.config.mjs, package.json
```

## 法的留意

- SEC EDGAR: User-Agent に連絡先メール必須（`SEC_EDGAR_USER_AGENT`）
- Polygon.io: 無料プランは商用利用可、ただし掲載元（Polygon.io）の表示推奨
- TradingView: 帰属表示（"TradingViewの提供"リンク）を維持
- 翻訳はブラウザ機能に委ねる（誤訳責任の切り分け明確化）
- 投資勧誘的表現は禁止、「情報提供」スタンス
