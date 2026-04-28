import Link from "next/link";
import { notFound } from "next/navigation";
import { FilingList } from "@/components/FilingList";
import { findByTicker, getCompanyInfo } from "@/lib/edgar/client";

export const dynamic = "force-dynamic";

const FORMS = ["all", "10-K", "10-Q", "8-K"] as const;

export default async function FilingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ ticker: string }>;
  searchParams: Promise<{ form?: string }>;
}) {
  const { ticker } = await params;
  const { form = "all" } = await searchParams;
  const upper = ticker.toUpperCase();
  const entry = await findByTicker(upper);
  if (!entry) notFound();

  const { info, filings } = await getCompanyInfo(entry.cik);
  const filtered =
    form === "all" ? filings : filings.filter((f) => f.formType === form);

  return (
    <div className="space-y-6">
      <header>
        <Link
          href={`/stock/${entry.ticker}`}
          className="text-sm text-blue-700 hover:underline"
        >
          ← {entry.ticker} {info.name}
        </Link>
        <h1 className="mt-2 text-xl font-semibold">フィリング一覧</h1>
      </header>

      <div className="flex flex-wrap gap-2">
        {FORMS.map((f) => {
          const active = (form ?? "all") === f;
          return (
            <Link
              key={f}
              href={`/stock/${entry.ticker}/filings${f === "all" ? "" : `?form=${encodeURIComponent(f)}`}`}
              className={
                "rounded-full border px-3 py-1 text-xs " +
                (active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-500")
              }
            >
              {f === "all" ? "すべて" : f}
            </Link>
          );
        })}
      </div>

      <FilingList ticker={entry.ticker} filings={filtered} limit={100} />
    </div>
  );
}
