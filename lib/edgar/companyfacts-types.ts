// 型と純関数のみ。Node モジュール（fs等）は持たない → Client Component から安全に import 可能。

export type FundamentalPoint = {
  end: string;
  val: number;
  fy?: number;
  fp?: string;
  form?: string;
};

export type Fundamentals = {
  cik: string;
  entityName: string;
  revenue: FundamentalPoint[];
  netIncome: FundamentalPoint[];
  epsBasic: FundamentalPoint[];
  epsDiluted: FundamentalPoint[];
  sharesOutstanding: FundamentalPoint[];
  assets: FundamentalPoint[];
  liabilities: FundamentalPoint[];
  cashAndEquivalents: FundamentalPoint[];
  operatingCashFlow: FundamentalPoint[];
};

// TTM（直近12ヶ月）の数値を、四半期データ4つ合計または年次1つで返す
export function computeTtm(points: FundamentalPoint[]): number | null {
  if (points.length === 0) return null;
  const annual = points.find((p) => p.form === "10-K");
  if (annual) {
    const annualEnd = new Date(annual.end);
    const now = new Date();
    const diffDays =
      (now.getTime() - annualEnd.getTime()) / (24 * 60 * 60 * 1000);
    if (diffDays <= 100) return annual.val;
  }
  const quarters = points.filter((p) => p.form === "10-Q").slice(0, 4);
  if (quarters.length < 4) return null;
  return quarters.reduce((sum, p) => sum + p.val, 0);
}

export function formatUsd(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  return `${sign}$${Math.round(abs).toLocaleString("en-US")}`;
}

export function formatShares(v: number | null): string {
  if (v === null || !Number.isFinite(v)) return "—";
  if (v >= 1e9) return `${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  return Math.round(v).toLocaleString("en-US");
}
