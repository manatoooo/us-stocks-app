import { readCache, withCache, writeCache } from "@/lib/cache/fileCache";

const BASE = "https://api.polygon.io";

function apiKey(): string {
  const k = process.env.POLYGON_API_KEY;
  if (!k || k.includes("your-polygon-key")) {
    throw new Error(
      "POLYGON_API_KEY が未設定です。.env.local に取得済みのキーを設定してください。",
    );
  }
  return k;
}

async function polygonFetch<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const url = `${BASE}${path}${sep}apiKey=${apiKey()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Polygon ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

export type GroupedBar = {
  T: string;
  v: number;
  vw?: number;
  o: number;
  c: number;
  h: number;
  l: number;
  t: number;
  n?: number;
};

type GroupedResponse = {
  status?: string;
  resultsCount?: number;
  results?: GroupedBar[];
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function previousUsTradingDate(now = new Date()): string {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export async function getGroupedDaily(date?: string): Promise<{
  date: string;
  bars: GroupedBar[];
}> {
  const target = date ?? previousUsTradingDate();
  return withCache(
    "polygon",
    `grouped_${target}`,
    24 * 60 * 60 * 1000,
    async () => {
      const data = await polygonFetch<GroupedResponse>(
        `/v2/aggs/grouped/locale/us/market/stocks/${target}?adjusted=true`,
      );
      return { date: target, bars: data.results ?? [] };
    },
  );
}

export type TickerDetails = {
  ticker: string;
  name: string;
  market_cap?: number;
  share_class_shares_outstanding?: number;
  weighted_shares_outstanding?: number;
  sic_code?: string;
  sic_description?: string;
  primary_exchange?: string;
};

type DetailsResponse = { results?: TickerDetails };

const DETAILS_TTL_MS = 24 * 60 * 60 * 1000;

export async function readCachedTickerDetails(
  ticker: string,
): Promise<TickerDetails | null> {
  return readCache<TickerDetails>("polygon", `details_${ticker}`);
}

export async function getTickerDetails(
  ticker: string,
): Promise<TickerDetails | null> {
  const cached = await readCachedTickerDetails(ticker);
  if (cached) return cached;
  try {
    const data = await polygonFetch<DetailsResponse>(
      `/v3/reference/tickers/${encodeURIComponent(ticker)}`,
    );
    const result = data.results ?? null;
    if (result) {
      await writeCache("polygon", `details_${ticker}`, result, DETAILS_TTL_MS);
    }
    return result;
  } catch {
    return null;
  }
}

export async function getPreviousClose(ticker: string): Promise<GroupedBar | null> {
  return withCache(
    "polygon",
    `prev_${ticker}`,
    6 * 60 * 60 * 1000,
    async () => {
      try {
        const data = await polygonFetch<GroupedResponse>(
          `/v2/aggs/ticker/${encodeURIComponent(ticker)}/prev?adjusted=true`,
        );
        return data.results?.[0] ?? null;
      } catch {
        return null;
      }
    },
  );
}
