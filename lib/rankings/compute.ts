import {
  getGroupedDaily,
  getTickerDetails,
  readCachedTickerDetails,
  type GroupedBar,
  type TickerDetails,
} from "@/lib/polygon/client";
import { getTopByPv } from "@/lib/pv/tracker";
import { SEED_TICKERS } from "@/lib/rankings/seed";

export type RankingRow = {
  ticker: string;
  name?: string;
  value: number;
  valueLabel: string;
  sub?: string;
};

export type RankingResult = {
  asOf: string;
  rows: RankingRow[];
  note?: string;
};

function fmtNumber(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Math.round(n).toLocaleString("en-US");
}

function fmtUsd(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${fmtNumber(Math.round(n))}`;
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function nameOf(ticker: string): string | undefined {
  return SEED_TICKERS.find((s) => s.ticker === ticker)?.name;
}

export async function rankingByVolume(limit = 30): Promise<RankingResult> {
  const { date, bars } = await getGroupedDaily();
  const rows = [...bars]
    .filter((b) => /^[A-Z][A-Z.\-]{0,5}$/.test(b.T))
    .sort((a, b) => b.v - a.v)
    .slice(0, limit)
    .map<RankingRow>((b) => ({
      ticker: b.T,
      name: nameOf(b.T),
      value: b.v,
      valueLabel: `${fmtNumber(b.v)} 株`,
      sub: `終値 $${b.c.toFixed(2)}`,
    }));
  return { asOf: date, rows };
}

export async function rankingByDollarVolume(limit = 30): Promise<RankingResult> {
  const { date, bars } = await getGroupedDaily();
  const rows = [...bars]
    .filter((b) => /^[A-Z][A-Z.\-]{0,5}$/.test(b.T))
    .map((b) => ({ bar: b, dollar: b.v * b.c }))
    .sort((a, b) => b.dollar - a.dollar)
    .slice(0, limit)
    .map<RankingRow>(({ bar, dollar }) => ({
      ticker: bar.T,
      name: nameOf(bar.T),
      value: dollar,
      valueLabel: fmtUsd(dollar),
      sub: `出来高 ${fmtNumber(bar.v)}株 × 終値 $${bar.c.toFixed(2)}`,
    }));
  return { asOf: date, rows };
}

// Polygon Free プランは 5 calls/min。50銘柄分の Ticker Details を律儀に取ると
// 10分以上かかるため、リクエストではキャッシュ済み分のみ集計し、未取得分は
// バックグラウンドで順次キャッシュに追加していく方式にする。
const RATE_LIMIT_INTERVAL_MS = 12_500;
let warmupRunning = false;

function startMarketCapWarmup(): void {
  if (warmupRunning) return;
  warmupRunning = true;
  void (async () => {
    try {
      for (const seed of SEED_TICKERS) {
        const cached = await readCachedTickerDetails(seed.ticker);
        if (cached) continue;
        await getTickerDetails(seed.ticker);
        await new Promise((r) => setTimeout(r, RATE_LIMIT_INTERVAL_MS));
      }
    } finally {
      warmupRunning = false;
    }
  })();
}

function computeMarketCap(
  details: TickerDetails,
  bar: GroupedBar | undefined,
): number {
  if (details.market_cap && details.market_cap > 0) return details.market_cap;
  const shares =
    details.weighted_shares_outstanding ??
    details.share_class_shares_outstanding ??
    0;
  if (shares > 0 && bar) return shares * bar.c;
  return 0;
}

export async function rankingByMarketCap(limit = 30): Promise<RankingResult> {
  const { date, bars } = await getGroupedDaily();
  const closeMap = new Map(bars.map((b) => [b.T, b]));

  const out: { ticker: string; cap: number; bar?: GroupedBar }[] = [];
  let pendingCount = 0;
  for (const seed of SEED_TICKERS) {
    const details = await readCachedTickerDetails(seed.ticker);
    if (!details) {
      pendingCount += 1;
      continue;
    }
    const bar = closeMap.get(seed.ticker);
    const cap = computeMarketCap(details, bar);
    if (cap > 0) out.push({ ticker: seed.ticker, cap, bar });
  }

  if (pendingCount > 0) startMarketCapWarmup();

  out.sort((a, b) => b.cap - a.cap);
  const rows = out
    .slice(0, limit)
    .map<RankingRow>(({ ticker, cap, bar }) => ({
      ticker,
      name: nameOf(ticker),
      value: cap,
      valueLabel: fmtUsd(cap),
      sub: bar ? `終値 $${bar.c.toFixed(2)}` : undefined,
    }));

  const total = SEED_TICKERS.length;
  const fetched = total - pendingCount;
  const note =
    pendingCount > 0
      ? `主要${total}銘柄のうち${fetched}銘柄を表示中。残り${pendingCount}銘柄をバックグラウンドで取得中（Polygon無料プラン 5 calls/min 制限のため約${Math.ceil((pendingCount * 12.5) / 60)}分）。時間をおいてリロードすると増えます。`
      : undefined;

  return { asOf: date, rows, note };
}

export function isMarketCapWarmupRunning(): boolean {
  return warmupRunning;
}

export async function rankingBySector(): Promise<RankingResult> {
  const { date, bars } = await getGroupedDaily();
  const closeMap = new Map(bars.map((b) => [b.T, b]));

  type Acc = { sumChange: number; count: number };
  const buckets = new Map<string, Acc>();

  for (const seed of SEED_TICKERS) {
    const bar = closeMap.get(seed.ticker);
    if (!bar) continue;
    const change = bar.o > 0 ? ((bar.c - bar.o) / bar.o) * 100 : 0;
    const cur = buckets.get(seed.sector) ?? { sumChange: 0, count: 0 };
    cur.sumChange += change;
    cur.count += 1;
    buckets.set(seed.sector, cur);
  }

  const rows = [...buckets.entries()]
    .map<RankingRow>(([sector, acc]) => {
      const avg = acc.count > 0 ? acc.sumChange / acc.count : 0;
      return {
        ticker: sector,
        value: avg,
        valueLabel: fmtPct(avg),
        sub: `対象 ${acc.count} 銘柄の単純平均`,
      };
    })
    .sort((a, b) => b.value - a.value);

  return { asOf: date, rows };
}

export async function rankingByPv(
  limit = 30,
  windowDays = 7,
): Promise<RankingResult> {
  const top = await getTopByPv(limit, windowDays);
  const rows = top.map<RankingRow>((r) => ({
    ticker: r.ticker,
    name: nameOf(r.ticker),
    value: r.views,
    valueLabel: `${fmtNumber(r.views)} PV`,
    sub: `過去${windowDays}日の累計`,
  }));
  return { asOf: new Date().toISOString().slice(0, 10), rows };
}
