"use client";

const STORAGE_KEY = "us-stocks-app:favorites";
const MAX_FAVORITES = 30;

export type FavoriteEntry = {
  ticker: string;
  addedAt: number; // unix ms
};

function read(): FavoriteEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is FavoriteEntry =>
        typeof e?.ticker === "string" && typeof e?.addedAt === "number",
    );
  } catch {
    return [];
  }
}

function write(entries: FavoriteEntry[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent("favorites-changed"));
}

export function getFavorites(): FavoriteEntry[] {
  return read().sort((a, b) => b.addedAt - a.addedAt);
}

export function isFavorite(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  return read().some((e) => e.ticker === upper);
}

export function addFavorite(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  const current = read();
  if (current.some((e) => e.ticker === upper)) return false;
  if (current.length >= MAX_FAVORITES) {
    write([
      { ticker: upper, addedAt: Date.now() },
      ...current.slice(0, MAX_FAVORITES - 1),
    ]);
  } else {
    write([{ ticker: upper, addedAt: Date.now() }, ...current]);
  }
  return true;
}

export function removeFavorite(ticker: string): boolean {
  const upper = ticker.toUpperCase();
  const current = read();
  const filtered = current.filter((e) => e.ticker !== upper);
  if (filtered.length === current.length) return false;
  write(filtered);
  return true;
}

export function toggleFavorite(ticker: string): boolean {
  if (isFavorite(ticker)) {
    removeFavorite(ticker);
    return false;
  }
  addFavorite(ticker);
  return true;
}

export function subscribeFavorites(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener("favorites-changed", handler);
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) cb();
  });
  return () => {
    window.removeEventListener("favorites-changed", handler);
  };
}

export const FAVORITES_LIMIT = MAX_FAVORITES;
