import Link from "next/link";
import { CompareForm } from "@/components/CompareForm";
import { MiniSymbolOverview } from "@/components/MiniSymbolOverview";
import { mapWithConcurrency } from "@/lib/concurrency";
import { findByTicker, getCompanyInfo } from "@/lib/edgar/client";
import { exchangeToTradingView, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CompareRow = {
  ticker: string;
  companyName: string | null;
  cik: string | null;
  sicDescription: string | null;
  exchange: string | null;
  tradingViewExchange: string;
  last10K: { filedAt: string; primaryDocUrl: string; accessionNo: string } | null;
  last10Q: { filedAt: string; primaryDocUrl: string; accessionNo: string } | null;
  last8K: { filedAt: string; primaryDocUrl: string; accessionNo: string } | null;
  error: string | null;
};

async function loadRow(ticker: string): Promise<CompareRow> {
  try {
    const entry = await findByTicker(ticker);
    if (!entry) {
      return {
        ticker,
        companyName: null,
        cik: null,
        sicDescription: null,
        exchange: null,
        tradingViewExchange: "NASDAQ",
        last10K: null,
        last10Q: null,
        last8K: null,
        error: "未登録のティッカー",
      };
    }
    const { info, filings } = await getCompanyInfo(entry.cik);
    const last10K = filings.find((f) => f.formType === "10-K") ?? null;
    const last10Q = filings.find((f) => f.formType === "10-Q") ?? null;
    const last8K = filings.find((f) => f.formType === "8-K") ?? null;

    const pickFiling = (
      f: typeof last10K,
    ): CompareRow["last10K"] =>
      f
        ? {
            filedAt: f.filedAt,
            primaryDocUrl: f.primaryDocUrl,
            accessionNo: f.accessionNo,
          }
        : null;

    return {
      ticker: entry.ticker,
      companyName: info.name,
      cik: info.cik,
      sicDescription: info.sicDescription,
      exchange: info.exchange,
      tradingViewExchange: exchangeToTradingView(info.exchange),
      last10K: pickFiling(last10K),
      last10Q: pickFiling(last10Q),
      last8K: pickFiling(last8K),
      error: null,
    };
  } catch (e) {
    return {
      ticker,
      companyName: null,
      cik: null,
      sicDescription: null,
      exchange: null,
      tradingViewExchange: "NASDAQ",
      last10K: null,
      last10Q: null,
      last8K: null,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ tickers?: string }>;
}) {
  const { tickers: raw = "" } = await searchParams;
  const tickers = raw
    .split(/[\s,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 5);

  const rows: CompareRow[] =
    tickers.length > 0
      ? await mapWithConcurrency(tickers, 4, (t) => loadRow(t))
      : [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">銘柄比較</h1>
        <p className="mt-1 text-sm text-slate-500">
          複数の米国株を横断比較。SEC EDGAR の会社情報・直近フィリングと、
          TradingView の株価ミニチャートを並べて表示します（最大5銘柄）。
        </p>
      </header>

      <CompareForm initial={tickers} />

      {rows.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
          上の入力欄に比較したいティッカーをカンマ区切りで指定してください。
          例: <code>AAPL, MSFT, NVDA</code>
        </div>
      ) : (
        <>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))`,
            }}
          >
            {rows.map((r) => (
              <article
                key={r.ticker}
                className="rounded-md border border-slate-200 bg-white p-3"
              >
                <header className="mb-2">
                  {r.error ? (
                    <span className="font-mono text-sm font-semibold text-red-700">
                      {r.ticker}
                    </span>
                  ) : (
                    <Link
                      href={`/stock/${r.ticker}`}
                      className="hover:underline"
                    >
                      <div className="font-mono text-base font-semibold text-slate-900">
                        {r.ticker}
                      </div>
                      <div className="truncate text-xs text-slate-500">
                        {r.companyName}
                      </div>
                    </Link>
                  )}
                </header>

                {r.error ? (
                  <p className="rounded bg-red-50 p-2 text-xs text-red-700">
                    {r.error}
                  </p>
                ) : (
                  <MiniSymbolOverview
                    ticker={r.ticker}
                    exchange={r.tradingViewExchange}
                    height={160}
                  />
                )}
              </article>
            ))}
          </div>

          {rows.some((r) => !r.error) && (
            <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">項目</th>
                    {rows.map((r) => (
                      <th
                        key={r.ticker}
                        className="min-w-[160px] px-3 py-2 text-left font-mono font-medium text-slate-900"
                      >
                        {r.ticker}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="px-3 py-2 text-xs text-slate-500">業種</td>
                    {rows.map((r) => (
                      <td key={r.ticker} className="px-3 py-2 text-sm text-slate-700">
                        {r.sicDescription ?? "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-xs text-slate-500">市場</td>
                    {rows.map((r) => (
                      <td key={r.ticker} className="px-3 py-2 text-sm text-slate-700">
                        {r.exchange ?? "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-xs text-slate-500">CIK</td>
                    {rows.map((r) => (
                      <td
                        key={r.ticker}
                        className="px-3 py-2 font-mono text-xs text-slate-500"
                      >
                        {r.cik ?? "—"}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-xs text-slate-500">直近 10-K</td>
                    {rows.map((r) => (
                      <td key={r.ticker} className="px-3 py-2 text-xs">
                        {r.last10K ? (
                          <Link
                            href={`/stock/${r.ticker}/filings/${encodeURIComponent(r.last10K.accessionNo)}`}
                            className="text-blue-700 hover:underline"
                          >
                            {formatDate(r.last10K.filedAt)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-xs text-slate-500">直近 10-Q</td>
                    {rows.map((r) => (
                      <td key={r.ticker} className="px-3 py-2 text-xs">
                        {r.last10Q ? (
                          <Link
                            href={`/stock/${r.ticker}/filings/${encodeURIComponent(r.last10Q.accessionNo)}`}
                            className="text-blue-700 hover:underline"
                          >
                            {formatDate(r.last10Q.filedAt)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-xs text-slate-500">直近 8-K</td>
                    {rows.map((r) => (
                      <td key={r.ticker} className="px-3 py-2 text-xs">
                        {r.last8K ? (
                          <Link
                            href={`/stock/${r.ticker}/filings/${encodeURIComponent(r.last8K.accessionNo)}`}
                            className="text-blue-700 hover:underline"
                          >
                            {formatDate(r.last8K.filedAt)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-slate-400">
        株価・出来高・時価総額の数値は当サイトでは再配信していません。詳細な数値は各ミニチャート（TradingView提供）または銘柄詳細ページからご確認ください。
      </p>
    </div>
  );
}
