import { NextResponse } from "next/server";
import { getCompanyInfo } from "@/lib/edgar/client";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ cik: string }> },
) {
  const { cik } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const form = searchParams.get("form");
  const limit = Number(searchParams.get("limit") ?? "30");

  try {
    const { filings } = await getCompanyInfo(cik);
    const filtered = form
      ? filings.filter((f) => f.formType === form)
      : filings;
    return NextResponse.json({ data: filtered.slice(0, limit), error: null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json(
      { data: null, error: { code: "EDGAR_FILINGS_FAILED", message: msg } },
      { status: 500 },
    );
  }
}
