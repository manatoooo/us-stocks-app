import Link from "next/link";
import { TradingViewHeatmap } from "@/components/TradingViewHeatmap";

export const dynamic = "force-static";

export default function RankingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold tracking-tight">米国市場ヒートマップ</h1>
        <p className="mt-1 text-sm text-slate-500">
          S&amp;P 500 構成銘柄をセクター別に並べ、時価総額（タイル面積）と当日騰落率（色）で俯瞰します。
          チャートをクリックすると TradingView 上で詳細を確認できます。
        </p>
      </header>

      <section className="rounded-md border border-slate-200 bg-white p-3">
        <TradingViewHeatmap height={620} />
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-700">
        <h2 className="mb-2 text-base font-semibold text-slate-800">補助コンテンツ</h2>
        <ul className="space-y-1 text-sm">
          <li>
            🌟 <Link href="/dashboard" className="text-blue-700 hover:underline">お気に入りダッシュボード</Link> ：
            あなたの保有・ウォッチ銘柄を1画面で俯瞰
          </li>
          <li>
            ⚡ <Link href="/news" className="text-blue-700 hover:underline">8-K速報</Link> ：
            主要50銘柄の重要事象報告（SEC EDGAR一次データ）
          </li>
          <li>
            📅 <Link href="/earnings" className="text-blue-700 hover:underline">決算カレンダー</Link> ：
            次回 10-K / 10-Q 提出予測
          </li>
          <li>
            🕴 <Link href="/insiders" className="text-blue-700 hover:underline">インサイダー取引</Link> ：
            役員・大株主の Form 4 報告
          </li>
        </ul>
      </section>

      <p className="text-xs text-slate-400">
        市場ヒートマップは TradingView 提供の埋め込みウィジェットを使用しています（無料・帰属表示維持）。
        当サイトの自社サーバーは株価・出来高・時価総額の数値再配信は行いません。
      </p>
    </div>
  );
}
