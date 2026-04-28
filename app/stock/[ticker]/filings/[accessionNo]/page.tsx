import Link from "next/link";
import { notFound } from "next/navigation";
import { findByTicker, getCompanyInfo } from "@/lib/edgar/client";
import { formatDate, formTypeLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FilingDetailPage({
  params,
}: {
  params: Promise<{ ticker: string; accessionNo: string }>;
}) {
  const { ticker, accessionNo: rawAcc } = await params;
  const accessionNo = decodeURIComponent(rawAcc);

  const upper = ticker.toUpperCase();
  const entry = await findByTicker(upper);
  if (!entry) notFound();

  const { info, filings } = await getCompanyInfo(entry.cik);
  const filing = filings.find((f) => f.accessionNo === accessionNo);
  if (!filing) notFound();

  return (
    <div className="space-y-6">
      <header>
        <Link
          href={`/stock/${entry.ticker}/filings`}
          className="text-sm text-blue-700 hover:underline"
        >
          ← {entry.ticker} のフィリング一覧へ
        </Link>
        <h1 className="mt-2 text-xl font-semibold">
          {formTypeLabel(filing.formType)}
        </h1>
        <p className="text-sm text-slate-500">
          {info.name}（{entry.ticker}） ／ 提出日 {formatDate(filing.filedAt)}
          {filing.reportDate && <> ／ 対象期 {formatDate(filing.reportDate)}</>}
        </p>
      </header>

      <section className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <dl className="grid grid-cols-1 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-slate-500">アクセッションナンバー</dt>
            <dd className="font-mono">{filing.accessionNo}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">主要書類</dt>
            <dd className="truncate font-mono">{filing.primaryDocument}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-md border border-emerald-200 bg-emerald-50/40 p-5">
        <h2 className="mb-2 text-base font-semibold text-emerald-900">
          原文を読む
        </h2>
        <p className="mb-4 text-sm text-slate-700">
          SEC EDGAR の原文を新しいタブで開きます。Chrome / Edge の「日本語に翻訳」を使えば自動翻訳で読めます。
        </p>
        <a
          href={filing.primaryDocUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-md bg-emerald-700 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          SEC EDGAR で原文を開く ↗
        </a>
        <p className="mt-3 break-all text-xs text-slate-500">
          {filing.primaryDocUrl}
        </p>
      </section>
    </div>
  );
}
