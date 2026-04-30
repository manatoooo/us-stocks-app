"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { MiniSymbolOverview } from "@/components/MiniSymbolOverview";
import { StockSearch } from "@/components/StockSearch";
import {
  FAVORITES_LIMIT,
  getFavorites,
  removeFavorite,
  subscribeFavorites,
  type FavoriteEntry,
} from "@/lib/favorites/store";
import { formatDate } from "@/lib/utils";

type FavoriteSummary = {
  ticker: string;
  resolved: {
    cik: string;
    companyName: string;
    sicDescription: string | null;
    exchange: string | null;
    tradingViewExchange: string;
    latest8K: {
      filedAt: string;
      accessionNo: string;
      primaryDocUrl: string;
    } | null;
    latestEarnings: {
      formType: string;
      filedAt: string;
      reportDate: string | null;
      accessionNo: string;
      primaryDocUrl: string;
    } | null;
    upcomingExpected: string | null;
  } | null;
  error: string | null;
};

export default function DashboardPage() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>([]);
  const [summaries, setSummaries] = useState<FavoriteSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const reloadFavorites = useCallback(() => {
    setFavorites(getFavorites());
  }, []);

  useEffect(() => {
    setMounted(true);
    reloadFavorites();
    return subscribeFavorites(reloadFavorites);
  }, [reloadFavorites]);

  useEffect(() => {
    if (!mounted) return;
    if (favorites.length === 0) {
      setSummaries([]);
      return;
    }
    let aborted = false;
    setLoading(true);
    fetch(
      `/api/favorites?tickers=${encodeURIComponent(
        favorites.map((f) => f.ticker).join(","),
      )}`,
    )
      .then((res) => res.json())
      .then((json) => {
        if (aborted) return;
        if (json.data) setSummaries(json.data as FavoriteSummary[]);
      })
      .catch(() => {
        if (!aborted) setSummaries([]);
      })
      .finally(() => {
        if (!aborted) setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [favorites, mounted]);

  if (!mounted) {
    return <div className="text-sm text-slate-500">読み込み中…</div>;
  }

  const sortedSummaries = favorites
    .map((fav) => summaries.find((s) => s.ticker === fav.ticker) ?? null)
    .filter((s): s is FavoriteSummary => s !== null);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">
          お気に入りダッシュボード
        </h1>
        <p className="text-sm text-slate-500">
          お気に入りに登録した米国株を1画面で俯瞰。株価チャート（TradingView提供）と SEC EDGAR の最新フィリングを並べて表示します。
          お気に入りはお使いのブラウザのローカルストレージに保存されます（最大{FAVORITES_LIMIT}銘柄）。
        </p>
        <div className="pt-2">
          <StockSearch />
        </div>
      </header>

      {favorites.length === 0 && (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
          <p className="font-medium">まだお気に入りがありません。</p>
          <p className="mt-2">
            銘柄詳細ページの「☆ お気に入り」ボタンを押して追加してください。
            上の検索ボックスからティッカーや会社名で検索できます。
          </p>
        </div>
      )}

      {favorites.length > 0 && (
        <>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {favorites.length} / {FAVORITES_LIMIT} 銘柄
              {loading && <span className="ml-2 text-slate-400">読み込み中…</span>}
            </span>
            <button
              onClick={() => {
                if (confirm("すべてのお気に入りを削除しますか？")) {
                  for (const f of favorites) removeFavorite(f.ticker);
                }
              }}
              className="text-slate-500 hover:text-red-700"
            >
              すべて削除
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sortedSummaries.map((s) => (
              <article
                key={s.ticker}
                className="rounded-md border border-slate-200 bg-white p-4 shadow-sm"
              >
                <header className="mb-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/stock/${s.ticker}`}
                      className="block truncate hover:underline"
                    >
                      <span className="mr-2 font-mono text-base font-semibold text-slate-900">
                        {s.ticker}
                      </span>
                      <span className="text-sm text-slate-700">
                        {s.resolved?.companyName ?? "—"}
                      </span>
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {s.resolved?.sicDescription ?? "—"} ／ {s.resolved?.exchange ?? "—"}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFavorite(s.ticker)}
                    className="rounded border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:border-red-300 hover:text-red-700"
                    title="お気に入りから削除"
                  >
                    ✕
                  </button>
                </header>

                {s.error || !s.resolved ? (
                  <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                    {s.error ?? "情報取得に失敗しました"}
                  </div>
                ) : (
                  <>
                    <MiniSymbolOverview
                      ticker={s.ticker}
                      exchange={s.resolved.tradingViewExchange}
                      height={180}
                    />

                    <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <dt className="text-slate-500">最新 8-K</dt>
                        <dd>
                          {s.resolved.latest8K ? (
                            <Link
                              href={`/stock/${s.ticker}/filings/${encodeURIComponent(s.resolved.latest8K.accessionNo)}`}
                              className="text-blue-700 hover:underline"
                            >
                              {formatDate(s.resolved.latest8K.filedAt)}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">直近決算</dt>
                        <dd>
                          {s.resolved.latestEarnings ? (
                            <Link
                              href={`/stock/${s.ticker}/filings/${encodeURIComponent(s.resolved.latestEarnings.accessionNo)}`}
                              className="text-blue-700 hover:underline"
                            >
                              {formatDate(s.resolved.latestEarnings.filedAt)}
                              <span className="ml-1 text-slate-400">
                                ({s.resolved.latestEarnings.formType})
                              </span>
                            </Link>
                          ) : (
                            "—"
                          )}
                        </dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-slate-500">次回決算（推定）</dt>
                        <dd className="font-mono text-slate-700">
                          {s.resolved.upcomingExpected ? formatDate(s.resolved.upcomingExpected) : "—"}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Link
                        href={`/stock/${s.ticker}`}
                        className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:border-slate-500"
                      >
                        詳細
                      </Link>
                      <Link
                        href={`/stock/${s.ticker}/filings`}
                        className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:border-slate-500"
                      >
                        フィリング一覧
                      </Link>
                      <a
                        href={`https://news.google.com/search?q=${encodeURIComponent(`${s.ticker} stock`)}&hl=ja`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-slate-300 px-2 py-1 text-slate-700 hover:border-slate-500"
                      >
                        Googleニュース ↗
                      </a>
                    </div>
                  </>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
