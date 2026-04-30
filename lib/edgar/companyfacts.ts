import { withCache } from "@/lib/cache/fileCache";
import { padCik } from "@/lib/edgar/client";
import type {
  FundamentalPoint,
  Fundamentals,
} from "@/lib/edgar/companyfacts-types";

export type {
  FundamentalPoint,
  Fundamentals,
} from "@/lib/edgar/companyfacts-types";
export {
  computeTtm,
  formatUsd,
  formatShares,
} from "@/lib/edgar/companyfacts-types";

const BASE = "https://data.sec.gov/api/xbrl/companyfacts";

function userAgent() {
  return (
    process.env.SEC_EDGAR_USER_AGENT || "us-stocks-app manatoooo1234@gmail.com"
  );
}

type XbrlUnit = {
  end: string;
  val: number;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
  frame?: string;
};

type XbrlFact = {
  label?: string;
  description?: string;
  units: Record<string, XbrlUnit[]>;
};

type CompanyFactsResponse = {
  cik: number;
  entityName: string;
  facts: {
    "us-gaap"?: Record<string, XbrlFact>;
    dei?: Record<string, XbrlFact>;
  };
};

function pickPoints(
  fact: XbrlFact | undefined,
  unit: string,
  limit: number,
): FundamentalPoint[] {
  if (!fact) return [];
  const arr = fact.units[unit];
  if (!arr) return [];
  // 10-K / 10-Q の本決算値のみ採用、新しい順
  const filtered = arr
    .filter((u) => u.form === "10-K" || u.form === "10-Q")
    .sort((a, b) => b.end.localeCompare(a.end));
  // 同じ end が重複しているとき（修正提出など）は最初を採用
  const seen = new Set<string>();
  const unique: FundamentalPoint[] = [];
  for (const u of filtered) {
    if (seen.has(u.end)) continue;
    seen.add(u.end);
    unique.push({
      end: u.end,
      val: u.val,
      fy: u.fy,
      fp: u.fp,
      form: u.form,
    });
    if (unique.length >= limit) break;
  }
  return unique;
}

function pickFirstAvailable(
  facts: Record<string, XbrlFact> | undefined,
  candidates: string[],
): XbrlFact | undefined {
  if (!facts) return undefined;
  for (const k of candidates) {
    if (facts[k]) return facts[k];
  }
  return undefined;
}

export async function getFundamentals(
  cik: string,
): Promise<Fundamentals | null> {
  const padded = padCik(cik);
  return withCache(
    "edgar",
    `companyfacts_${padded}`,
    24 * 60 * 60 * 1000,
    async () => {
      const url = `${BASE}/CIK${padded}.json`;
      const res = await fetch(url, {
        headers: {
          "User-Agent": userAgent(),
          Accept: "application/json",
        },
        cache: "no-store",
      });
      if (!res.ok) {
        // companyfacts が無い銘柄もある（小型株など）
        if (res.status === 404) return null;
        throw new Error(
          `companyfacts fetch failed: ${res.status} ${res.statusText}`,
        );
      }
      const json = (await res.json()) as CompanyFactsResponse;
      const usgaap = json.facts["us-gaap"];

      const revenueFact = pickFirstAvailable(usgaap, [
        "Revenues",
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "SalesRevenueNet",
      ]);
      const netIncomeFact = pickFirstAvailable(usgaap, [
        "NetIncomeLoss",
        "ProfitLoss",
      ]);
      const epsBasicFact = pickFirstAvailable(usgaap, [
        "EarningsPerShareBasic",
      ]);
      const epsDilutedFact = pickFirstAvailable(usgaap, [
        "EarningsPerShareDiluted",
      ]);
      const sharesFact = pickFirstAvailable(usgaap, [
        "CommonStockSharesOutstanding",
        "EntityCommonStockSharesOutstanding",
      ]);
      const assetsFact = pickFirstAvailable(usgaap, ["Assets"]);
      const liabilitiesFact = pickFirstAvailable(usgaap, ["Liabilities"]);
      const cashFact = pickFirstAvailable(usgaap, [
        "CashAndCashEquivalentsAtCarryingValue",
        "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents",
      ]);
      const opCfFact = pickFirstAvailable(usgaap, [
        "NetCashProvidedByUsedInOperatingActivities",
      ]);

      return {
        cik: padded,
        entityName: json.entityName,
        revenue: pickPoints(revenueFact, "USD", 8),
        netIncome: pickPoints(netIncomeFact, "USD", 8),
        epsBasic: pickPoints(epsBasicFact, "USD/shares", 8),
        epsDiluted: pickPoints(epsDilutedFact, "USD/shares", 8),
        sharesOutstanding: pickPoints(sharesFact, "shares", 4),
        assets: pickPoints(assetsFact, "USD", 4),
        liabilities: pickPoints(liabilitiesFact, "USD", 4),
        cashAndEquivalents: pickPoints(cashFact, "USD", 4),
        operatingCashFlow: pickPoints(opCfFact, "USD", 4),
      };
    },
  );
}

