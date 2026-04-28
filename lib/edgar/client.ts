import { withCache } from "@/lib/cache/fileCache";
import type { CompanyInfo, Filing, TickerEntry } from "@/lib/edgar/types";

const TICKERS_URL = "https://www.sec.gov/files/company_tickers.json";

function userAgent() {
  return (
    process.env.SEC_EDGAR_USER_AGENT ||
    "us-stocks-app manatoooo1234@gmail.com"
  );
}

async function edgarFetch(url: string): Promise<Response> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": userAgent(),
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`EDGAR fetch failed: ${res.status} ${res.statusText} (${url})`);
  }
  return res;
}

export function padCik(cik: string | number): string {
  return String(cik).padStart(10, "0");
}

type RawTickers = Record<
  string,
  { cik_str: number; ticker: string; title: string }
>;

async function fetchAllTickers(): Promise<TickerEntry[]> {
  return withCache("edgar", "tickers", 24 * 60 * 60 * 1000, async () => {
    const res = await edgarFetch(TICKERS_URL);
    const raw = (await res.json()) as RawTickers;
    return Object.values(raw).map((t) => ({
      cik: padCik(t.cik_str),
      ticker: t.ticker.toUpperCase(),
      name: t.title,
    }));
  });
}

export async function searchCompanies(
  query: string,
  limit = 20,
): Promise<TickerEntry[]> {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const all = await fetchAllTickers();
  const exact = all.filter((t) => t.ticker === q);
  const startsWith = all.filter(
    (t) => t.ticker !== q && t.ticker.startsWith(q),
  );
  const nameMatch = all.filter(
    (t) =>
      !t.ticker.startsWith(q) && t.name.toUpperCase().includes(q),
  );
  return [...exact, ...startsWith, ...nameMatch].slice(0, limit);
}

export async function findByTicker(ticker: string): Promise<TickerEntry | null> {
  const t = ticker.trim().toUpperCase();
  if (!t) return null;
  const all = await fetchAllTickers();
  return all.find((entry) => entry.ticker === t) ?? null;
}

type RawSubmissions = {
  cik: string;
  name: string;
  tickers?: string[];
  exchanges?: string[];
  sic?: string;
  sicDescription?: string;
  category?: string;
  fiscalYearEnd?: string;
  addresses?: unknown;
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      reportDate: string[];
      form: string[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
  };
};

export async function getCompanyInfo(cik: string): Promise<{
  info: CompanyInfo;
  filings: Filing[];
}> {
  const padded = padCik(cik);
  return withCache("edgar", `submissions_${padded}`, 60 * 60 * 1000, async () => {
    const url = `https://data.sec.gov/submissions/CIK${padded}.json`;
    const res = await edgarFetch(url);
    const raw = (await res.json()) as RawSubmissions;

    const info: CompanyInfo = {
      cik: padded,
      name: raw.name,
      ticker: raw.tickers?.[0] ?? null,
      sic: raw.sic ?? null,
      sicDescription: raw.sicDescription ?? null,
      exchange: raw.exchanges?.[0] ?? null,
      category: raw.category ?? null,
      fiscalYearEnd: raw.fiscalYearEnd ?? null,
      addresses: raw.addresses,
    };

    const r = raw.filings.recent;
    const cikNumeric = String(parseInt(padded, 10));
    const filings: Filing[] = r.accessionNumber.map((acc, i) => {
      const accNoDash = acc.replace(/-/g, "");
      const primaryDoc = r.primaryDocument[i] || "";
      return {
        accessionNo: acc,
        formType: r.form[i],
        filedAt: r.filingDate[i],
        reportDate: r.reportDate[i] || null,
        primaryDocument: primaryDoc,
        primaryDocDescription: r.primaryDocDescription[i] || null,
        primaryDocUrl: `https://www.sec.gov/Archives/edgar/data/${cikNumeric}/${accNoDash}/${primaryDoc}`,
        filingIndexUrl: `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${padded}&type=&dateb=&owner=include&count=40`,
      };
    });

    return { info, filings };
  });
}

export async function fetchFilingText(
  cik: string,
  accessionNo: string,
  primaryDocument: string,
  maxChars = 12000,
): Promise<string> {
  const padded = padCik(cik);
  const cikNumeric = String(parseInt(padded, 10));
  const accNoDash = accessionNo.replace(/-/g, "");
  const url = `https://www.sec.gov/Archives/edgar/data/${cikNumeric}/${accNoDash}/${primaryDocument}`;

  return withCache(
    "edgar",
    `text_${padded}_${accNoDash}`,
    7 * 24 * 60 * 60 * 1000,
    async () => {
      const res = await fetch(url, {
        headers: { "User-Agent": userAgent() },
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Filing text fetch failed: ${res.status}`);
      }
      const html = await res.text();
      const stripped = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, " ")
        .trim();
      return stripped.slice(0, maxChars);
    },
  );
}
