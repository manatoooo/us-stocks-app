import Link from "next/link";
import type { Filing } from "@/lib/edgar/types";
import { formatDate, formTypeLabel } from "@/lib/utils";

const HIGHLIGHT = new Set(["10-K", "10-Q", "8-K", "20-F", "6-K", "S-1"]);

export function FilingList({
  ticker,
  filings,
  limit = 30,
}: {
  ticker: string;
  filings: Filing[];
  limit?: number;
}) {
  const visible = filings.slice(0, limit);
  if (visible.length === 0) {
    return (
      <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
        フィリングが見つかりませんでした。
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-2 font-medium">提出日</th>
            <th className="px-4 py-2 font-medium">書類種別</th>
            <th className="px-4 py-2 font-medium">対象期</th>
            <th className="px-4 py-2 font-medium">アクション</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((f) => (
            <tr key={f.accessionNo} className="border-t border-slate-100">
              <td className="whitespace-nowrap px-4 py-2 font-mono text-slate-700">
                {formatDate(f.filedAt)}
              </td>
              <td className="px-4 py-2">
                <span
                  className={
                    "inline-block rounded px-2 py-0.5 text-xs font-medium " +
                    (HIGHLIGHT.has(f.formType)
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-700")
                  }
                >
                  {formTypeLabel(f.formType)}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-slate-600">
                {formatDate(f.reportDate)}
              </td>
              <td className="px-4 py-2">
                <div className="flex gap-3 text-xs">
                  <Link
                    href={`/stock/${ticker}/filings/${encodeURIComponent(
                      f.accessionNo,
                    )}`}
                    className="text-blue-700 hover:underline"
                  >
                    日本語訳を見る
                  </Link>
                  <a
                    href={f.primaryDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:underline"
                  >
                    SEC原文 ↗
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
