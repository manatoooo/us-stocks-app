import { promises as fs } from "node:fs";
import path from "node:path";

// Vercel/AWS Lambda などのサーバーレス環境では project ディレクトリは Read-Only。
// 書き込み可能な /tmp にフォールバックする。/tmp は Lambda インスタンス間では
// 共有されず、コールドスタートで揮発するが、ウォーム間ではキャッシュとして機能する。
const CACHE_ROOT = process.env.VERCEL
  ? "/tmp/us-stocks-cache"
  : path.join(process.cwd(), "data", "cache");

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

function safeKey(key: string) {
  return key.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function ensureDir() {
  await fs.mkdir(CACHE_ROOT, { recursive: true });
}

export async function readCache<T>(namespace: string, key: string): Promise<T | null> {
  await ensureDir();
  const file = path.join(CACHE_ROOT, `${safeKey(namespace)}__${safeKey(key)}.json`);
  try {
    const raw = await fs.readFile(file, "utf-8");
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (entry.expiresAt < Date.now()) return null;
    return entry.value;
  } catch {
    return null;
  }
}

export async function writeCache<T>(
  namespace: string,
  key: string,
  value: T,
  ttlMs: number,
): Promise<void> {
  await ensureDir();
  const file = path.join(CACHE_ROOT, `${safeKey(namespace)}__${safeKey(key)}.json`);
  const entry: CacheEntry<T> = { expiresAt: Date.now() + ttlMs, value };
  await fs.writeFile(file, JSON.stringify(entry), "utf-8");
}

export async function withCache<T>(
  namespace: string,
  key: string,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<T> {
  const cached = await readCache<T>(namespace, key);
  if (cached !== null) return cached;
  const fresh = await loader();
  await writeCache(namespace, key, fresh, ttlMs);
  return fresh;
}
