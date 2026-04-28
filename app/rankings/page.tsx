import Link from "next/link";
import {
  rankingByDollarVolume,
  rankingByMarketCap,
  rankingByPv,
  rankingBySector,
  rankingByVolume,
  type RankingResult,
} from "@/lib/rankings/compute";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "volume", label: "出来高" },
  { key: "dollarVolume", label: "売買代金" },
  { key: "marketCap", label: "時価総額" },
  { key: "sector", label: "セクター騰落" },
  { key: "popular", label: "PV人気" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function isTab(s: string): s is TabKey {
  return TABS.some((t) => t.key === s);
}

async function loadRanking(type: TabKey): Promise<{
  result: RankingResult | null;
  error: string | null;
}> {
  try {
    if (type === "volume") return { result: await rankingByVolume(30), error: null };
    if (type === "dollarVolume")
      return { result: await rankingByDollarVolume(30), error: null };
    if (type === "marketCap")
      return { result: await rankingByMarketCap(30), error: null };
    if (type === "sector") return { result: await rankingBySector(), error: null };
    return { result: await rankingByPv(30, 7), error: null };
  } catch (e) {
    return { result: null, error: e instanceof Error ? e.message : "unknown error" };
  }
}

function tabDescription(type: TabKey): string {
  switch (type) {
    case "volume":
      return "前営業日の出来高（株数）が多かった銘柄ランキング。データ: Polygon.io。";
    case "dollarVolume":
      return "前営業日の売買代金（出来高 × 終値）ランキング。データ: Polygon.io。";
    case "marketCap":
      return "主要50銘柄を対象とした時価総額ランキング。データ: Polygon.io（Ticker Details）。";
    case "sector":
      return "主要50銘柄をセクターで集計した当日騰落率（始値→終値）。データ: Polygon.io × 自前のセクター分類。";
    case "popular":
      return "本サイト内の銘柄ページ閲覧数（過去7日）ランキング。自前集計。";
  }
}

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type: rawType = "volume" } = await searchParams;
  const type: TabKey = isTab(rawType) ? rawType : "volume";
  const { result, error } = await loadRanking(type);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">ランキング</h1>
        <p className="mt-1 text-sm text-slate-500">
          米国株の主要ランキングを4種類掲載。出来高・売買代金・時価総額・セクター騰落・PV人気。
        </p>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map((t) => {
          const active = t.key === type;
          return (
            <Link
              key={t.key}
              href={`/rankings?type=${t.key}`}
              className={
                "rounded-full border px-3 py-1 text-sm transition " +
                (active
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-500")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      <p className="text-xs text-slate-500">{tabDescription(type)}</p>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">取得に失敗しました</p>
          <p className="mt-1 break-words">{error}</p>
          {error.includes("POLYGON_API_KEY") && (
            <p className="mt-2 text-xs">
              [.env.local](file:.env.local) に <code>POLYGON_API_KEY</code> を設定してください（無料プラン取得可）。
            </p>
          )}
        </div>
      )}

      {result && (
        <>
          <p className="text-xs text-slate-500">基準日: {result.asOf}</p>

          {result.note && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              {result.note}
            </div>
          )}

          {result.rows.length === 0 ? (
            <p className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              {type === "popular"
                ? "まだPVデータがありません。銘柄ページを訪問すると集計されます。"
                : "対象銘柄がありませんでした。"}
            </p>
          ) : (
            <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="w-14 px-4 py-2 font-medium">#</th>
                    <th className="px-4 py-2 font-medium">
                      {type === "sector" ? "セクター" : "銘柄"}
                    </th>
                    <th className="px-4 py-2 text-right font-medium">値</th>
                    <th className="px-4 py-2 font-medium">補足</th>
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={row.ticker} className="border-t border-slate-100">
                      <td className="px-4 py-2 font-mono text-slate-500">
                        {i + 1}
                      </td>
                      <td className="px-4 py-2">
                        {type === "sector" ? (
                          <span className="font-medium text-slate-900">
                            {row.ticker}
                          </span>
                        ) : (
                          <Link
                            href={`/stock/${row.ticker}`}
                            className="block hover:underline"
                          >
                            <span className="mr-2 font-mono font-semibold text-slate-900">
                              {row.ticker}
                            </span>
                            {row.name && (
                              <span className="text-xs text-slate-500">
                                {row.name}
                              </span>
                            )}
                          </Link>
                        )}
                      </td>
                      <td
                        className={
                          "px-4 py-2 text-right font-mono " +
                          (type === "sector"
                            ? row.value >= 0
                              ? "text-emerald-700"
                              : "text-red-700"
                            : "text-slate-900")
                        }
                      >
                        {row.valueLabel}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {row.sub ?? ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
