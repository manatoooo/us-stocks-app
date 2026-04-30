"use client";

import { useEffect, useState } from "react";
import {
  isFavorite,
  subscribeFavorites,
  toggleFavorite,
} from "@/lib/favorites/store";

export function FavoriteButton({ ticker }: { ticker: string }) {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setActive(isFavorite(ticker));
    return subscribeFavorites(() => setActive(isFavorite(ticker)));
  }, [ticker]);

  if (!mounted) {
    return (
      <button
        disabled
        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-400"
      >
        ☆ お気に入り
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        const nowActive = toggleFavorite(ticker);
        setActive(nowActive);
      }}
      className={
        "rounded-md border px-3 py-1.5 text-sm transition " +
        (active
          ? "border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400"
          : "border-slate-300 bg-white text-slate-700 hover:border-slate-500")
      }
      aria-pressed={active}
    >
      {active ? "★ お気に入り済" : "☆ お気に入り"}
    </button>
  );
}
