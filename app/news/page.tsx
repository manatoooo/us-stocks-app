import Link from "next/link";
import { getRecent8K } from "@/lib/feeds/edgar";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewsPage() {
  let filings: Awaited<ReturnType<typeof getRecent8K>> = [];
  let error: string | null = null;
  try {
    filings = await getRecent8K(60);
  } catch (e) {
    error = e instanceof Error ? e.message : "unknown error";
  }

  // 日付ごとにグルーピング
  const byDate = new Map<string, typeof filings>();
  for (const f of filings) {
    const list = byDate.get(f.filedAt) ?? [];
    list.push(f);
    byDate.set(f.filedAt, list);
  }
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">8-K 速報フィード</h1>
        <p className="mt-1 text-sm text-slate-500">
          主要50銘柄の重要事象報告（8-K）を時系列で表示。SEC EDGAR の元データ。
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          取得失敗: {error}
        </div>
      )}

      {filings.length === 0 && !error && (
        <p className="text-sm text-slate-500">最近の8-Kはありません。</p>
      )}

      <div className="space-y-8">
        {dates.map((d) => (
          <section key={d}>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              {formatDate(d)}
            </h2>
            <ul className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">
              {byDate.get(d)!.map((f) => (
                <li
                  key={f.accessionNo}
                  className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <Link
                    href={`/stock/${f.ticker}`}
                    className="w-24 font-mono text-sm font-semibold text-slate-900 hover:underline"
                  >
                    {f.ticker}
                  </Link>
                  <span className="flex-1 truncate text-sm text-slate-700">
                    {f.companyName}
                  </span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    8-K
                  </span>
                  <Link
                    href={`/stock/${f.ticker}/filings/${encodeURIComponent(f.accessionNo)}`}
                    className="text-xs text-blue-700 hover:underline"
                  >
                    詳細
                  </Link>
                  <a
                    href={f.primaryDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:underline"
                  >
                    SEC原文 ↗
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
