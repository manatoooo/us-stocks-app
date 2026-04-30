import { NextResponse } from "next/server";
import { mapWithConcurrency } from "@/lib/concurrency";
import { findByTicker, getCompanyInfo } from "@/lib/edgar/client";
import { exchangeToTradingView } from "@/lib/utils";

export const runtime = "nodejs";

export type FavoriteSummary = {
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get("tickers") ?? "";
  const tickers = raw
    .split(/[\s,]+/)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 30);

  if (tickers.length === 0) {
    return NextResponse.json({ data: [], error: null });
  }

  const result = await mapWithConcurrency<string, FavoriteSummary>(
    tickers,
    4,
    async (ticker) => {
      try {
        const entry = await findByTicker(ticker);
        if (!entry) {
          return { ticker, resolved: null, error: "未登録のティッカー" };
        }
        const { info, filings } = await getCompanyInfo(entry.cik);
        const last8K = filings.find((f) => f.formType === "8-K") ?? null;
        const lastEarnings =
          filings.find((f) => f.formType === "10-K") ??
          filings.find((f) => f.formType === "10-Q") ??
          null;

        // 次回提出予測（年次は365日後、四半期は91日後）
        let upcomingExpected: string | null = null;
        if (lastEarnings) {
          const isAnnual = lastEarnings.formType === "10-K";
          const d = new Date(lastEarnings.filedAt);
          d.setUTCDate(d.getUTCDate() + (isAnnual ? 365 : 91));
          upcomingExpected = d.toISOString().slice(0, 10);
        }

        return {
          ticker: entry.ticker,
          resolved: {
            cik: info.cik,
            companyName: info.name,
            sicDescription: info.sicDescription,
            exchange: info.exchange,
            tradingViewExchange: exchangeToTradingView(info.exchange),
            latest8K: last8K
              ? {
                  filedAt: last8K.filedAt,
                  accessionNo: last8K.accessionNo,
                  primaryDocUrl: last8K.primaryDocUrl,
                }
              : null,
            latestEarnings: lastEarnings
              ? {
                  formType: lastEarnings.formType,
                  filedAt: lastEarnings.filedAt,
                  reportDate: lastEarnings.reportDate,
                  accessionNo: lastEarnings.accessionNo,
                  primaryDocUrl: lastEarnings.primaryDocUrl,
                }
              : null,
            upcomingExpected,
          },
          error: null,
        };
      } catch (e) {
        return {
          ticker,
          resolved: null,
          error: e instanceof Error ? e.message : "unknown error",
        };
      }
    },
  );

  return NextResponse.json({ data: result, error: null });
}
