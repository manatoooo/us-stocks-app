"use client";

import { useEffect } from "react";

export function PvTracker({ ticker }: { ticker: string }) {
  useEffect(() => {
    const url = `/api/pv?ticker=${encodeURIComponent(ticker)}`;
    fetch(url, { method: "POST" }).catch(() => {});
  }, [ticker]);
  return null;
}
