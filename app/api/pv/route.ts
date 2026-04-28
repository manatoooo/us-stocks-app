import { NextResponse } from "next/server";
import { recordView } from "@/lib/pv/tracker";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker") ?? "";
  if (!ticker.trim()) {
    return NextResponse.json(
      { data: null, error: { code: "MISSING_TICKER", message: "ticker is required" } },
      { status: 400 },
    );
  }
  try {
    await recordView(ticker);
    return NextResponse.json({ data: { ok: true }, error: null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return NextResponse.json(
      { data: null, error: { code: "PV_FAILED", message: msg } },
      { status: 500 },
    );
  }
}
