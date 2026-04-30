# 米国株まとめサイト (us-stocks-app) — 無料・非商用構成

SEC EDGAR + TradingView Widget のみで構成された米国株情報サイト MVP。
日本人個人投資家向けに、米国株のフィリング (10-K/10-Q/8-K 等) とファンダメンタルを日本語で読めるように構築。

## 設計方針: 「無料・非商用」を厳守

調査の結果、株価データAPI（Polygon, Finnhub, Alpaca, FMP, Alpha Vantage, Twelve Data など）は
無料プランの利用規約上、不特定多数への公開サイトでの利用が認められていないことが判明したため、
本MVPは以下の方針で構築されている。

- **株価・出来高・チャート・ヒートマップ → TradingView Widget の埋め込み**（埋め込みは商用OK・帰属表示維持必須）
- **フィリング・企業情報・ファンダメンタル → SEC EDGAR API**（パブリックドメイン、商用OK）
- **ニュース → 自社で再配信せず Google News 検索リンクで誘導**（著作権・APIライセンスの両リスク回避）
- **アナリスト評価・正確な決算カレンダー・配当履歴 → 機能カット or TradingView Widget に委ねる**
- **商用APIのキーはサーバーに置かない**（POLYGON_API_KEY 等は環境変数から完全に削除）

詳細は `c:\claudecompany\リサーチ\report_20260430_us_stocks_api_dashboard.md` を参照。

## 構成

- **Next.js 16 (App Router) + TypeScript + Tailwind v4** — 単体で `npm run dev` 起動
- **データソース**:
  - フィリング: SEC EDGAR Submissions API（無料・キー不要・User-Agent必須）
  - ファンダメンタル: SEC EDGAR XBRL companyfacts API（同上、EPS/Revenue/NetIncome等を自前算出）
- **株価チャート**: TradingView 埋め込みウィジェット（Symbol Overview / Mini Symbol Overview / Stock Heatmap、15分遅延、商用OK、帰属表示維持）
- **翻訳**: 採用しない（Chrome / Edge の自動翻訳を利用）
- **キャッシュ**: ファイルベース (`data/cache/`)。PV集計も同階層に蓄積
- **お気に入り**: ブラウザの localStorage（最大30銘柄）

## セットアップ

```bash
cd c:/claudecompany/開発/us-stocks-app
npm install
cp .env.local.example .env.local   # Windowsなら copy .env.local.example .env.local
# .env.local の SEC_EDGAR_USER_AGENT を自分のメールアドレスに書き換える
npm run dev
```

ブラウザで `http://localhost:3000` を開く。

## 主要ページ

- `/` ホーム — 検索・人気銘柄・コンテンツ一覧
- `/dashboard` **お気に入りダッシュボード** — localStorage に保存した銘柄を1画面で俯瞰（チャート・最新8-K・次回決算予測）
- `/stock/[ticker]` 銘柄詳細 — TradingView チャート + ファンダメンタル + 最新フィリング + お気に入り追加
- `/stock/[ticker]/filings/[accessionNo]` フィリング詳細
- `/rankings` 市場ヒートマップ — TradingView Stock Heatmap Widget（S&P 500 セクター別）
- `/news` 8-K速報フィード — 主要50銘柄の重要事象報告
- `/earnings` 決算カレンダー — 次回 10-K / 10-Q 提出予測（直近提出から推定）
- `/insiders` インサイダー取引 — Form 4 報告
- `/compare` 銘柄比較 — 最大5銘柄の会社情報・直近フィリング・ミニチャートを横並び

## 動作確認シナリオ

- `/` → 検索ボックスに `AAPL` → サジェスト → `/stock/AAPL`
- `/stock/AAPL` → 「☆ お気に入り」ボタンをクリック → `/dashboard` に表示されることを確認
- `/dashboard` → 各カードのミニチャート・最新8-K・次回決算予測が表示
- `/rankings` → S&P 500 ヒートマップが表示
- `/compare?tickers=AAPL,MSFT,NVDA` → 横並び比較

## ディレクトリ構成

```
us-stocks-app/
├── app/
│   ├── layout.tsx, page.tsx, globals.css
│   ├── search/page.tsx
│   ├── dashboard/page.tsx        # お気に入りダッシュボード（NEW）
│   ├── rankings/page.tsx          # TradingView Heatmap
│   ├── news/page.tsx              # 8-K 速報
│   ├── earnings/page.tsx          # 決算カレンダー
│   ├── insiders/page.tsx          # Form 4
│   ├── compare/page.tsx           # 銘柄比較
│   ├── stock/[ticker]/page.tsx    # 銘柄詳細（ファンダメンタル＋お気に入りボタン追加）
│   ├── stock/[ticker]/filings/page.tsx
│   ├── stock/[ticker]/filings/[accessionNo]/page.tsx
│   └── api/
│       ├── search/route.ts
│       ├── company/[cik]/route.ts
│       ├── filings/[cik]/route.ts
│       ├── pv/route.ts
│       └── favorites/route.ts     # ダッシュボード用バッチ取得（NEW）
├── components/
│   ├── StockSearch.tsx
│   ├── TradingViewChart.tsx       # 銘柄詳細のメインチャート
│   ├── MiniSymbolOverview.tsx     # ダッシュボード/比較用ミニチャート（NEW）
│   ├── TradingViewHeatmap.tsx     # /rankings 用ヒートマップ（NEW）
│   ├── FavoriteButton.tsx         # お気に入り追加/削除ボタン（NEW）
│   ├── Fundamentals.tsx           # XBRL ファンダメンタル表示（NEW）
│   ├── FilingList.tsx
│   ├── CompareForm.tsx
│   └── PvTracker.tsx
├── lib/
│   ├── edgar/{client.ts, types.ts, companyfacts.ts}
│   ├── feeds/{edgar.ts, seed.ts}
│   ├── favorites/store.ts         # localStorage ラッパー（NEW）
│   ├── pv/tracker.ts
│   ├── cache/fileCache.ts
│   ├── concurrency.ts
│   └── utils.ts
├── data/cache/      # 実行時に生成されるキャッシュJSON群（gitignore）
├── .env.local       # SEC_EDGAR_USER_AGENT のみ
├── .env.local.example
├── next.config.ts, tsconfig.json, postcss.config.mjs, package.json
```

## 法的留意

- **SEC EDGAR**: User-Agent に連絡先メール必須（`SEC_EDGAR_USER_AGENT`）。10 req/sec 遵守。商用利用OK。
- **TradingView Widget**: 帰属表示（"TradingView提供"リンク）を維持。商用利用OK。
- **翻訳**: ブラウザの自動翻訳機能に委ねる（誤訳責任の切り分け明確化）
- **ニュース**: 自社では再配信せず Google News 検索リンクで外部誘導（記事著作権・ニュースAPIライセンスの両リスク回避）
- 投資勧誘的表現は禁止、「情報提供」スタンス
- サイト名・ドメイン名に SEC / EDGAR / EDGARLink を含めない（SEC の登録商標）

## 商用化フェーズへの移行

将来 AdSense などで収益化する場合のロードマップ:

1. **Vercel Hobby → Pro へ切替**（Hobby は商用利用NG、$20/月）
2. **株価の自社サーバー表示が必要なら Twelve Data Pro**（$149/月 + US Equities Add-On）— 公開ダッシュボード用途で公式に許諾されている唯一の選択肢
3. **ニュース機能を強化するなら Marketaux Standard**（$24/月）

詳細は `c:\claudecompany\リサーチ\report_20260430_us_stocks_api_dashboard.md` を参照。
