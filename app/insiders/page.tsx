import Link from "next/link";
import { getRecentForm4 } from "@/lib/feeds/edgar";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InsidersPage() {
  let filings: Awaited<ReturnType<typeof getRecentForm4>> = [];
  let error: string | null = null;
  try {
    filings = await getRecentForm4(80);
  } catch (e) {
    error = e instanceof Error ? e.message : "unknown error";
  }

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
        <h1 className="text-xl font-semibold tracking-tight">
          インサイダー取引情報
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          主要50銘柄の Form 4（経営陣・大株主の自社株売買報告）を時系列で表示。
          詳細な取引内容は SEC EDGAR の原文をご確認ください。
        </p>
      </header>

      <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <strong>Form 4 とは:</strong>{" "}
        役員・10%超大株主が自社株を売買した際、原則 2 営業日以内に SEC へ提出が義務付けられている報告書。
        提出件数が多い銘柄は内部関係者の動きが活発である目安になります。
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          取得失敗: {error}
        </div>
      )}

      {filings.length === 0 && !error && (
        <p className="text-sm text-slate-500">
          最近の Form 4 提出はありません。
        </p>
      )}

      <div className="space-y-8">
        {dates.map((d) => (
          <section key={d}>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              {formatDate(d)}
              <span className="ml-2 text-xs font-normal text-slate-400">
                {byDate.get(d)!.length}件
              </span>
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
                  <span className="rounded bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                    Form {f.formType}
                  </span>
                  <span className="font-mono text-xs text-slate-400">
                    {f.accessionNo}
                  </span>
                  <a
                    href={f.primaryDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-700 hover:underline"
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
