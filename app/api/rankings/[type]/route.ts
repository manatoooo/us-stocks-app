import { NextResponse } from "next/server";
import {
  rankingByDollarVolume,
  rankingByMarketCap,
  rankingByPv,
  rankingBySector,
  rankingByVolume,
} from "@/lib/rankings/compute";

export const runtime = "nodejs";

const HANDLERS = {
  volume: () => rankingByVolume(30),
  dollarVolume: () => rankingByDollarVolume(30),
  marketCap: () => rankingByMarketCap(30),
  sector: () => rankingBySector(),
  popular: () => rankingByPv(30, 7),
} as const;

type RankingType = keyof typeof HANDLERS;

function isRankingType(s: string): s is RankingType {
  return s in HANDLERS;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ type: string }> },
) {
  const { type } = await ctx.params;
  if (!isRankingType(type)) {
    return NextResponse.json(
      {
        data: null,
        error: { code: "UNKNOWN_TYPE", message: `unknown ranking type: ${type}` },
      },
      { status: 400 },
    );
  }
  try {
    const result = await HANDLERS[type]();
    return NextResponse.json({ data: result, error: null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json(
      { data: null, error: { code: "RANKING_FAILED", message: msg } },
      { status: 500 },
    );
  }
}
