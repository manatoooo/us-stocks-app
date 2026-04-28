"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CompareForm({ initial = [] }: { initial?: string[] }) {
  const router = useRouter();
  const [input, setInput] = useState(initial.join(", "));

  const submit = () => {
    const tickers = input
      .split(/[\s,]+/)
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, 5);
    if (tickers.length === 0) return;
    router.push(`/compare?tickers=${tickers.join(",")}`);
  };

  return (
    <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-center">
      <label className="text-sm font-medium text-slate-700">
        ティッカー（カンマ区切り、最大5銘柄）:
      </label>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="例: AAPL, MSFT, NVDA"
        className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-sm focus:border-slate-500 focus:outline-none"
      />
      <button
        onClick={submit}
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm text-white hover:bg-slate-700"
      >
        比較する
      </button>
    </div>
  );
}
