"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = { cik: string; ticker: string; name: string };

export function StockSearch({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initial);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.data) setSuggestions(json.data.slice(0, 8));
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const submit = () => {
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="relative w-full max-w-xl">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="ティッカーまたは会社名（例: AAPL, Tesla）"
          className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-slate-900 shadow-sm focus:border-slate-500 focus:outline-none"
        />
        <button
          onClick={submit}
          className="rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        >
          検索
        </button>
      </div>

      {open && (loading || suggestions.length > 0) && (
        <div className="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
          {loading && (
            <div className="px-4 py-2 text-sm text-slate-500">検索中…</div>
          )}
          {suggestions.map((s) => (
            <button
              key={s.cik}
              onMouseDown={() => router.push(`/stock/${s.ticker}`)}
              className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm hover:bg-slate-50"
            >
              <span className="font-mono font-semibold text-slate-900">
                {s.ticker}
              </span>
              <span className="flex-1 truncate text-slate-700">{s.name}</span>
              <span className="text-xs text-slate-400">CIK {s.cik}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
