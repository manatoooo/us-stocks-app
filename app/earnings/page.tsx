import Link from "next/link";
import { getEarningsCalendar, type EarningsEntry } from "@/lib/feeds/edgar";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function bucketLabel(daysFromExpected: number): {
  label: string;
  className: string;
} {
  if (daysFromExpected < -7)
    return {
      label: `${Math.abs(daysFromExpected)}日 経過`,
      className: "bg-slate-100 text-slate-600",
    };
  if (daysFromExpected < 0)
    return {
      label: `${Math.abs(daysFromExpected)}日 遅延`,
      className: "bg-amber-100 text-amber-800",
    };
  if (daysFromExpected <= 7)
    return {
      label: `${daysFromExpected}日後`,
      className: "bg-rose-100 text-rose-800",
    };
  if (daysFromExpected <= 30)
    return {
      label: `${daysFromExpected}日後`,
      className: "bg-emerald-100 text-emerald-800",
    };
  return {
    label: `${daysFromExpected}日後`,
    className: "bg-slate-100 text-slate-600",
  };
}

export default async function EarningsPage() {
  let entries: EarningsEntry[] = [];
  let error: string | null = null;
  try {
    entries = await getEarningsCalendar();
  } catch (e) {
    error = e instanceof Error ? e.message : "unknown error";
  }

  // 月ごとにグルーピング（次回提出予測日ベース）
  const byMonth = new Map<string, EarningsEntry[]>();
  for (const e of entries) {
    const key = monthKey(e.expectedNextFiling);
    const list = byMonth.get(key) ?? [];
    list.push(e);
    byMonth.set(key, list);
  }
  const months = [...byMonth.keys()].sort();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">決算カレンダー</h1>
        <p className="mt-1 text-sm text-slate-500">
          主要50銘柄の次回 10-K / 10-Q 提出予測カレンダー。
          直近の提出日から年次は365日後、四半期は91日後を予測としています（実際の提出日とは異なる場合があります）。
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          取得失敗: {error}
        </div>
      )}

      <div className="space-y-8">
        {months.map((m) => (
          <section key={m}>
            <h2 className="mb-2 text-sm font-semibold text-slate-700">
              {m.replace("-", "年 ") + "月"}
            </h2>
            <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="w-28 px-3 py-2 font-medium">予測日</th>
                    <th className="px-3 py-2 font-medium">銘柄</th>
                    <th className="w-20 px-3 py-2 font-medium">種別</th>
                    <th className="px-3 py-2 font-medium">前回提出</th>
                    <th className="w-32 px-3 py-2 font-medium">タイミング</th>
                  </tr>
                </thead>
                <tbody>
                  {byMonth.get(m)!.map((e) => {
                    const bucket = bucketLabel(e.daysFromExpected);
                    return (
                      <tr
                        key={`${e.ticker}_${e.accessionNo}`}
                        className="border-t border-slate-100"
                      >
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-700">
                          {formatDate(e.expectedNextFiling)}
                        </td>
                        <td className="px-3 py-2">
                          <Link
                            href={`/stock/${e.ticker}`}
                            className="hover:underline"
                          >
                            <span className="mr-2 font-mono font-semibold text-slate-900">
                              {e.ticker}
                            </span>
                            <span className="text-xs text-slate-500">
                              {e.companyName}
                            </span>
                          </Link>
                        </td>
                        <td className="px-3 py-2">
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            {e.formType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {formatDate(e.lastFiledAt)}
                          {e.lastReportDate && (
                            <span className="ml-2 text-slate-400">
                              （対象期 {formatDate(e.lastReportDate)}）
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${bucket.className}`}
                          >
                            {bucket.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
