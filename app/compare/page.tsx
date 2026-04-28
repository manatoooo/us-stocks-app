import Link from "next/link";
import { CompareForm } from "@/components/CompareForm";
import { mapWithConcurrency } from "@/lib/concurrency";
import { findByTicker, getCompanyInfo } from "@/lib/edgar/client";
import {
  getGroupedDaily,
  readCachedTickerDetails,
  type GroupedBar,
  type TickerDetails,
} from "@/lib/polygon/client";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

type CompareRow = {
  ticker: string;
  companyName: string | null;
  cik: string | null;
  sicDescription: string | null;
  exchange: string | null;
  bar: GroupedBar | null;
  details: TickerDetails | null;
  last10K: { filedAt: string; primaryDocUrl: string; accessionNo: string } | null;
  last10Q: { filedAt: string; primaryDocUrl: string; accessionNo: string } | null;
  error: string | null;
};

function fmtUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${Math.round(n).toLocaleString("en-US")}`;
}

function fmtPct(open: number, close: number): string {
  if (!open) return "—";
  const pct = ((close - open) / open) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
}

function pctColor(open: number, close: number): string {
  if (!open) return "text-slate-500";
  return close >= open ? "text-emerald-700" : "text-red-700";
}

async function loadRow(
  ticker: string,
  bars: Map<string, GroupedBar>,
): Promise<CompareRow> {
  try {
    const entry = await findByTicker(ticker);
    if (!entry) {
      return {
        ticker,
        companyName: null,
        cik: null,
        sicDescription: null,
        exchange: null,
        bar: null,
        details: null,
        last10K: null,
        last10Q: null,
        error: "未登録のティッカー",
      };
    }
    const { info, filings } = await getCompanyInfo(entry.cik);
    const last10K = filings.find((f) => f.formType === "10-K") ?? null;
    const last10Q = filings.find((f) => f.formType === "10-Q") ?? null;
    const details = await readCachedTickerDetails(entry.ticker);
    const bar = bars.get(entry.ticker) ?? null;

    return {
      ticker: entry.ticker,
      companyName: info.name,
      cik: info.cik,
      sicDescription: info.sicDescription,
      exchange: info.exchange,
      bar,
      details,
      last10K: last10K
        ? {
            filedAt: last10K.filedAt,
            primaryDocUrl: last10K.primaryDocUrl,
            accessionNo: last10K.accessionNo,
          }
        : null,
      last10Q: last10Q
        ? {
            filedAt: last10Q.filedAt,
            primaryDocUrl: last10Q.primaryDocUrl,
            accessionNo: last10Q.accessionNo,
          }
        : null,
      error: null,
    };
  } catch (e) {
    return {
      ticker,
      companyName: null,
      cik: null,
      sicDescription: null,
      exchange: null,
      bar: null,
      details: null,
      last10K: null,
      last10Q: null,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

function computeMarketCap(
  details: TickerDetails | null,
  bar: GroupedBar | null,
): number {
  if (!details) return 0;
  if (details.market_cap && details.market_cap > 0) return details.market_cap;
  const shares =
    details.weighted_shares_outstanding ??
    details.share_class_shares_outstanding ??
    0;
  if (shares > 0 && bar) return shares * bar.c;
  return 0;
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

  let rows: CompareRow[] = [];
  let polygonError: string | null = null;
  if (tickers.length > 0) {
    let barsMap = new Map<string, GroupedBar>();
    try {
      const { bars } = await getGroupedDaily();
      barsMap = new Map(bars.map((b) => [b.T, b]));
    } catch (e) {
      polygonError = e instanceof Error ? e.message : "polygon error";
    }
    rows = await mapWithConcurrency(tickers, 4, (t) => loadRow(t, barsMap));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">銘柄比較</h1>
        <p className="mt-1 text-sm text-slate-500">
          複数の米国株を横断比較。SEC EDGAR の会社情報・直近フィリング、
          Polygon.io の終値・出来高・時価総額を一覧表示。
        </p>
      </header>

      <CompareForm initial={tickers} />

      {polygonError && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Polygon の株価データ取得に失敗しました（会社情報のみ表示）: {polygonError}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="rounded-md border border-slate-200 bg-white p-5 text-sm text-slate-600">
          上の入力欄に比較したいティッカーをカンマ区切りで指定してください。
          例: <code>AAPL, MSFT, NVDA</code>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">項目</th>
                {rows.map((r) => (
                  <th key={r.ticker} className="min-w-[160px] px-3 py-2 text-left font-medium">
                    {r.error ? (
                      <span className="text-red-700">{r.ticker}</span>
                    ) : (
                      <Link href={`/stock/${r.ticker}`} className="hover:underline">
                        <span className="font-mono text-slate-900">{r.ticker}</span>
                        <div className="text-xs font-normal text-slate-500">
                          {r.companyName}
                        </div>
                      </Link>
                    )}
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
                  <td key={r.ticker} className="px-3 py-2 font-mono text-xs text-slate-500">
                    {r.cik ?? "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-xs text-slate-500">終値</td>
                {rows.map((r) => (
                  <td key={r.ticker} className="px-3 py-2 font-mono text-sm text-slate-900">
                    {r.bar ? `$${r.bar.c.toFixed(2)}` : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-xs text-slate-500">前営業日騰落</td>
                {rows.map((r) => (
                  <td
                    key={r.ticker}
                    className={`px-3 py-2 font-mono text-sm ${r.bar ? pctColor(r.bar.o, r.bar.c) : "text-slate-500"}`}
                  >
                    {r.bar ? fmtPct(r.bar.o, r.bar.c) : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-xs text-slate-500">出来高</td>
                {rows.map((r) => (
                  <td key={r.ticker} className="px-3 py-2 font-mono text-sm text-slate-700">
                    {r.bar ? Math.round(r.bar.v).toLocaleString("en-US") : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-xs text-slate-500">売買代金</td>
                {rows.map((r) => (
                  <td key={r.ticker} className="px-3 py-2 font-mono text-sm text-slate-700">
                    {r.bar ? fmtUsd(r.bar.v * r.bar.c) : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="px-3 py-2 text-xs text-slate-500">時価総額</td>
                {rows.map((r) => (
                  <td key={r.ticker} className="px-3 py-2 font-mono text-sm text-slate-700">
                    {fmtUsd(computeMarketCap(r.details, r.bar))}
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
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && rows.every((r) => !r.details) && (
        <p className="text-xs text-slate-500">
          ※ 時価総額が「—」の場合、Polygon の Ticker Details キャッシュが未取得です。
          [/rankings?type=marketCap](/rankings?type=marketCap) を一度開いて温めてからご利用ください。
        </p>
      )}
    </div>
  );
}
