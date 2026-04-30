import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "米国株まとめ | SEC EDGAR 日本語ビューア",
  description:
    "SEC EDGAR の米国株フィリングを日本語で読みやすく集約。お気に入りダッシュボード、TradingView チャート、8-K速報、決算カレンダー、インサイダー取引、銘柄比較。商用APIに依存しない無料公開サイトです。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              米国株まとめ <span className="text-slate-400">/ SEC EDGAR</span>
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <Link href="/" className="hover:text-slate-900">
                ホーム
              </Link>
              <Link href="/dashboard" className="hover:text-slate-900">
                ダッシュボード
              </Link>
              <Link href="/rankings" className="hover:text-slate-900">
                市場ヒートマップ
              </Link>
              <Link href="/news" className="hover:text-slate-900">
                8-K速報
              </Link>
              <Link href="/earnings" className="hover:text-slate-900">
                決算カレンダー
              </Link>
              <Link href="/insiders" className="hover:text-slate-900">
                インサイダー
              </Link>
              <Link href="/compare" className="hover:text-slate-900">
                銘柄比較
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500">
            <p>
              データソース: フィリング・ファンダメンタルは{" "}
              <a
                href="https://www.sec.gov/edgar"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                SEC EDGAR
              </a>
              （米国SEC公開データ／パブリックドメイン）／ 株価チャート・ヒートマップは{" "}
              <a
                href="https://jp.tradingview.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                TradingView
              </a>
              {" "}提供の埋め込みウィジェット
            </p>
            <p className="mt-1">
              当サイトは情報提供を目的とし、投資勧誘・助言を行うものではありません。商用 API による株価データの再配信は行っていません。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
