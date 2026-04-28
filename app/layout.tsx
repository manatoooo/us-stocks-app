import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "米国株まとめ | SEC EDGAR 日本語ビューア",
  description:
    "SEC EDGAR の米国株フィリングと Polygon.io の株価データを集約した情報サイト。ティッカー検索、TradingViewチャート、各種ランキング、8-K速報、決算カレンダー、インサイダー取引情報。",
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
              <Link href="/rankings" className="hover:text-slate-900">
                ランキング
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
              データソース: SEC EDGAR (
              <a
                href="https://www.sec.gov/edgar"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                公式
              </a>
              ) ／ 株価・出来高・時価総額:
              <a
                href="https://polygon.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Polygon.io
              </a>
              ／ チャート:
              <a
                href="https://jp.tradingview.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                TradingView
              </a>
            </p>
            <p className="mt-1">
              当サイトは情報提供を目的とし、投資勧誘・助言を行うものではありません。
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
