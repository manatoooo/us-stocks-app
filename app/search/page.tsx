import Link from "next/link";
import { StockSearch } from "@/components/StockSearch";
import { searchCompanies } from "@/lib/edgar/client";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = q.trim() ? await searchCompanies(q, 30) : [];

  return (
    <div className="space-y-6">
      <StockSearch initial={q} />

      <h1 className="text-lg font-semibold">
        「{q}」の検索結果
        <span className="ml-2 text-sm font-normal text-slate-500">
          {results.length}件
        </span>
      </h1>

      {results.length === 0 ? (
        <p className="text-sm text-slate-500">該当する銘柄が見つかりませんでした。</p>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-md border border-slate-200 bg-white">
          {results.map((r) => (
            <li key={r.cik}>
              <Link
                href={`/stock/${r.ticker}`}
                className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50"
              >
                <span className="w-20 font-mono font-semibold text-slate-900">
                  {r.ticker}
                </span>
                <span className="flex-1 truncate text-slate-700">{r.name}</span>
                <span className="text-xs text-slate-400">CIK {r.cik}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
