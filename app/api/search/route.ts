import { NextResponse } from "next/server";
import { searchCompanies } from "@/lib/edgar/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim()) {
    return NextResponse.json({ data: [], error: null });
  }
  try {
    const data = await searchCompanies(q, 20);
    return NextResponse.json({ data, error: null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json(
      { data: null, error: { code: "EDGAR_SEARCH_FAILED", message: msg } },
      { status: 500 },
    );
  }
}
