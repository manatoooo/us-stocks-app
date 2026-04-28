import { mapWithConcurrency } from "@/lib/concurrency";
import { findByTicker, getCompanyInfo } from "@/lib/edgar/client";
import type { Filing } from "@/lib/edgar/types";
import { SEED_TICKERS } from "@/lib/rankings/seed";

export type EnrichedFiling = Filing & {
  ticker: string;
  companyName: string;
};

type FetchedCompany = {
  ticker: string;
  companyName: string;
  filings: Filing[];
};

async function fetchAllSeedFilings(): Promise<FetchedCompany[]> {
  const results = await mapWithConcurrency(SEED_TICKERS, 4, async (seed) => {
    try {
      const entry = await findByTicker(seed.ticker);
      if (!entry) return null;
      const { info, filings } = await getCompanyInfo(entry.cik);
      return {
        ticker: seed.ticker,
        companyName: info.name,
        filings,
      } satisfies FetchedCompany;
    } catch {
      return null;
    }
  });
  return results.filter((r): r is FetchedCompany => r !== null);
}

function flattenAndSort(
  companies: FetchedCompany[],
  forms: string[],
  perCompany: number,
  totalLimit: number,
): EnrichedFiling[] {
  const all: EnrichedFiling[] = [];
  const formSet = new Set(forms);
  for (const c of companies) {
    const matched = c.filings
      .filter((f) => formSet.has(f.formType))
      .slice(0, perCompany);
    for (const f of matched) {
      all.push({ ...f, ticker: c.ticker, companyName: c.companyName });
    }
  }
  all.sort((a, b) => b.filedAt.localeCompare(a.filedAt));
  return all.slice(0, totalLimit);
}

export async function getRecent8K(limit = 50): Promise<EnrichedFiling[]> {
  const companies = await fetchAllSeedFilings();
  return flattenAndSort(companies, ["8-K"], 5, limit);
}

export async function getRecentForm4(limit = 60): Promise<EnrichedFiling[]> {
  const companies = await fetchAllSeedFilings();
  return flattenAndSort(companies, ["4", "4/A"], 8, limit);
}

export type EarningsEntry = {
  ticker: string;
  companyName: string;
  formType: string;
  lastFiledAt: string;
  lastReportDate: string | null;
  primaryDocUrl: string;
  accessionNo: string;
  expectedNextFiling: string;
  daysFromExpected: number;
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function diffDays(a: string, b: string): number {
  const ms = new Date(a).getTime() - new Date(b).getTime();
  return Math.round(ms / (24 * 60 * 60 * 1000));
}

export async function getEarningsCalendar(): Promise<EarningsEntry[]> {
  const companies = await fetchAllSeedFilings();
  const today = new Date().toISOString().slice(0, 10);

  const entries: EarningsEntry[] = [];
  for (const c of companies) {
    const last10K = c.filings.find((f) => f.formType === "10-K");
    const last10Q = c.filings.find((f) => f.formType === "10-Q");
    // 直近に提出されたほうを基準にする（10-Qのほうが頻度高いので大抵こちらが選ばれる）
    const candidates = [last10K, last10Q].filter((x): x is Filing => !!x);
    if (candidates.length === 0) continue;
    const latest = candidates.sort((a, b) =>
      b.filedAt.localeCompare(a.filedAt),
    )[0];

    const isAnnual = latest.formType === "10-K";
    const expected = addDays(latest.filedAt, isAnnual ? 365 : 91);
    entries.push({
      ticker: c.ticker,
      companyName: c.companyName,
      formType: latest.formType,
      lastFiledAt: latest.filedAt,
      lastReportDate: latest.reportDate,
      primaryDocUrl: latest.primaryDocUrl,
      accessionNo: latest.accessionNo,
      expectedNextFiling: expected,
      daysFromExpected: diffDays(expected, today),
    });
  }

  entries.sort((a, b) =>
    a.expectedNextFiling.localeCompare(b.expectedNextFiling),
  );
  return entries;
}
