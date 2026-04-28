import { NextResponse } from "next/server";
import { getCompanyInfo } from "@/lib/edgar/client";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ cik: string }> },
) {
  const { cik } = await ctx.params;
  try {
    const result = await getCompanyInfo(cik);
    return NextResponse.json({ data: result, error: null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json(
      { data: null, error: { code: "EDGAR_COMPANY_FAILED", message: msg } },
      { status: 500 },
    );
  }
}
