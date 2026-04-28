import { promises as fs } from "node:fs";
import path from "node:path";

// 銘柄ページのアクセス数を集計するファイルベースの簡易PVカウンター。
// 将来Supabaseに差し替える前提で、この層だけ抽象化している。
//
// 保存形式: { events: [{ ticker, ts }, ...] } を JSON で保持。
// 7日より古いイベントは自動削除し、ファイルサイズが膨れないようにする。

const PV_FILE = path.join(process.cwd(), "data", "cache", "page_views.json");
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

type PvEvent = { ticker: string; ts: number };
type PvStore = { events: PvEvent[] };

async function readStore(): Promise<PvStore> {
  try {
    const raw = await fs.readFile(PV_FILE, "utf-8");
    const parsed = JSON.parse(raw) as PvStore;
    return { events: Array.isArray(parsed.events) ? parsed.events : [] };
  } catch {
    return { events: [] };
  }
}

async function writeStore(store: PvStore) {
  await fs.mkdir(path.dirname(PV_FILE), { recursive: true });
  await fs.writeFile(PV_FILE, JSON.stringify(store), "utf-8");
}

function prune(store: PvStore): PvStore {
  const cutoff = Date.now() - RETENTION_MS;
  return { events: store.events.filter((e) => e.ts >= cutoff) };
}

export async function recordView(ticker: string): Promise<void> {
  const upper = ticker.trim().toUpperCase();
  if (!upper) return;
  const store = prune(await readStore());
  store.events.push({ ticker: upper, ts: Date.now() });
  await writeStore(store);
}

export async function getTopByPv(
  limit = 30,
  windowDays = 7,
): Promise<{ ticker: string; views: number }[]> {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const store = await readStore();
  const counts = new Map<string, number>();
  for (const e of store.events) {
    if (e.ts < cutoff) continue;
    counts.set(e.ticker, (counts.get(e.ticker) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([ticker, views]) => ({ ticker, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}
