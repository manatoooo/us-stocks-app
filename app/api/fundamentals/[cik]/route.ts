import { NextResponse } from "next/server";
import { getFundamentals } from "@/lib/edgar/companyfacts";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ cik: string }> },
) {
  const { cik } = await ctx.params;
  try {
    const f = await getFundamentals(cik);
    return NextResponse.json({ data: f, error: null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json(
      { data: null, error: { code: "FUNDAMENTALS_FAILED", message: msg } },
      { status: 500 },
    );
  }
}
