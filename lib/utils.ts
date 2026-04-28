export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formTypeLabel(form: string): string {
  const map: Record<string, string> = {
    "10-K": "年次報告書 (10-K)",
    "10-Q": "四半期報告書 (10-Q)",
    "8-K": "重要事象報告 (8-K)",
    "S-1": "新規上場届出書 (S-1)",
    "DEF 14A": "委任状勧誘書 (DEF 14A)",
    "20-F": "外国企業年次報告書 (20-F)",
    "6-K": "外国企業中間報告 (6-K)",
  };
  return map[form] ?? form;
}

export function exchangeToTradingView(exchange: string | null): string {
  if (!exchange) return "NASDAQ";
  const u = exchange.toUpperCase();
  if (u.includes("NASDAQ")) return "NASDAQ";
  if (u.includes("NYSE")) return "NYSE";
  if (u.includes("CBOE") || u.includes("BATS")) return "AMEX";
  return "NASDAQ";
}
