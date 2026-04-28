import Link from "next/link";
import { StockSearch } from "@/components/StockSearch";

const FEATURED = [
  { ticker: "AAPL", name: "Apple Inc." },
  { ticker: "MSFT", name: "Microsoft Corporation" },
  { ticker: "NVDA", name: "NVIDIA Corporation" },
  { ticker: "GOOGL", name: "Alphabet Inc." },
  { ticker: "AMZN", name: "Amazon.com, Inc." },
  { ticker: "META", name: "Meta Platforms, Inc." },
  { ticker: "TSLA", name: "Tesla, Inc." },
  { ticker: "BRK-B", name: "Berkshire Hathaway Inc." },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">
          米国株のフィリングを、日本語で。
        </h1>
        <p className="text-sm text-slate-600">
          SEC EDGAR の 10-K・10-Q・8-K 等の一次情報と Polygon.io の株価データを統合。
          ティッカーで横断検索し、ランキング・8-K速報・決算カレンダー・インサイダー取引まで一画面で俯瞰できます。
        </p>
        <StockSearch />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-800">
          人気銘柄
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FEATURED.map((s) => (
            <Link
              key={s.ticker}
              href={`/stock/${s.ticker}`}
              className="rounded-md border border-slate-200 bg-white p-4 transition hover:border-slate-400 hover:shadow-sm"
            >
              <div className="font-mono text-base font-semibold text-slate-900">
                {s.ticker}
              </div>
              <div className="mt-1 truncate text-xs text-slate-500">
                {s.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-800">
          コンテンツ
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/rankings"
            className="rounded-md border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-slate-900">
              📊 ランキング
            </div>
            <div className="mt-1 text-xs text-slate-500">
              出来高・売買代金・時価総額・セクター騰落・PV人気の5種
            </div>
          </Link>
          <Link
            href="/news"
            className="rounded-md border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-slate-900">
              ⚡ 8-K速報フィード
            </div>
            <div className="mt-1 text-xs text-slate-500">
              主要50銘柄の重要事象報告を時系列で表示
            </div>
          </Link>
          <Link
            href="/earnings"
            className="rounded-md border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-slate-900">
              📅 決算カレンダー
            </div>
            <div className="mt-1 text-xs text-slate-500">
              次回 10-K / 10-Q 提出予測を月別に表示
            </div>
          </Link>
          <Link
            href="/insiders"
            className="rounded-md border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-sm"
          >
            <div className="text-sm font-semibold text-slate-900">
              🕴 インサイダー取引
            </div>
            <div className="mt-1 text-xs text-slate-500">
              役員・大株主の Form 4（自社株売買）報告
            </div>
          </Link>
          <Link
            href="/compare"
            className="rounded-md border border-slate-200 bg-white p-4 hover:border-slate-400 hover:shadow-sm sm:col-span-2"
          >
            <div className="text-sm font-semibold text-slate-900">
              ⚖ 銘柄比較
            </div>
            <div className="mt-1 text-xs text-slate-500">
              最大5銘柄を並べて株価・出来高・時価総額・直近フィリングを横断比較
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
