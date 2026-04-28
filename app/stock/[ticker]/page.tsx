import Link from "next/link";
import { notFound } from "next/navigation";
import { FilingList } from "@/components/FilingList";
import { PvTracker } from "@/components/PvTracker";
import { TradingViewChart } from "@/components/TradingViewChart";
import { findByTicker, getCompanyInfo } from "@/lib/edgar/client";
import { exchangeToTradingView } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function StockPage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;
  const upper = ticker.toUpperCase();
  const entry = await findByTicker(upper);
  if (!entry) notFound();

  const { info, filings } = await getCompanyInfo(entry.cik);
  const exchange = exchangeToTradingView(info.exchange);

  return (
    <div className="space-y-8">
      <PvTracker ticker={entry.ticker} />
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="rounded bg-slate-900 px-2 py-1 font-mono text-sm text-white">
            {entry.ticker}
          </span>
          <h1 className="text-xl font-semibold tracking-tight">{info.name}</h1>
        </div>
        <p className="text-sm text-slate-500">
          {info.sicDescription ?? "—"} ／ {info.exchange ?? "—"} ／ CIK {info.cik}
        </p>
      </header>

      <section className="rounded-md border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-base font-semibold text-slate-800">
          株価チャート
          <span className="ml-2 text-xs font-normal text-slate-400">
            (TradingView, 15分遅延)
          </span>
        </h2>
        <TradingViewChart ticker={entry.ticker} exchange={exchange} />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-800">
            最新フィリング
          </h2>
          <Link
            href={`/stock/${entry.ticker}/filings`}
            className="text-sm text-blue-700 hover:underline"
          >
            すべて見る →
          </Link>
        </div>
        <FilingList ticker={entry.ticker} filings={filings} limit={15} />
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-800">企業情報</h2>
        <dl className="grid grid-cols-1 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">SIC コード</dt>
            <dd>
              {info.sic ?? "—"} ／ {info.sicDescription ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">分類</dt>
            <dd>{info.category ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">決算期末</dt>
            <dd>{info.fiscalYearEnd ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">CIK</dt>
            <dd className="font-mono">{info.cik}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
