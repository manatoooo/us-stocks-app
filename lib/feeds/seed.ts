// 主要50銘柄のシード（8-K速報・Form 4・決算カレンダーの集計対象）
// セクターは GICS 系の大分類でラベリング（UI 表示用の括り）

export type SeedTicker = {
  ticker: string;
  name: string;
  sector: string;
};

export const SEED_TICKERS: SeedTicker[] = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "情報技術" },
  { ticker: "MSFT", name: "Microsoft Corporation", sector: "情報技術" },
  { ticker: "NVDA", name: "NVIDIA Corporation", sector: "情報技術" },
  { ticker: "AVGO", name: "Broadcom Inc.", sector: "情報技術" },
  { ticker: "ORCL", name: "Oracle Corporation", sector: "情報技術" },
  { ticker: "ADBE", name: "Adobe Inc.", sector: "情報技術" },
  { ticker: "CRM", name: "Salesforce, Inc.", sector: "情報技術" },
  { ticker: "AMD", name: "Advanced Micro Devices, Inc.", sector: "情報技術" },
  { ticker: "INTC", name: "Intel Corporation", sector: "情報技術" },
  { ticker: "CSCO", name: "Cisco Systems, Inc.", sector: "情報技術" },

  { ticker: "GOOGL", name: "Alphabet Inc. (Class A)", sector: "コミュニケーション" },
  { ticker: "META", name: "Meta Platforms, Inc.", sector: "コミュニケーション" },
  { ticker: "NFLX", name: "Netflix, Inc.", sector: "コミュニケーション" },
  { ticker: "DIS", name: "The Walt Disney Company", sector: "コミュニケーション" },
  { ticker: "T", name: "AT&T Inc.", sector: "コミュニケーション" },

  { ticker: "AMZN", name: "Amazon.com, Inc.", sector: "一般消費財" },
  { ticker: "TSLA", name: "Tesla, Inc.", sector: "一般消費財" },
  { ticker: "HD", name: "The Home Depot, Inc.", sector: "一般消費財" },
  { ticker: "MCD", name: "McDonald's Corporation", sector: "一般消費財" },
  { ticker: "NKE", name: "Nike, Inc.", sector: "一般消費財" },
  { ticker: "SBUX", name: "Starbucks Corporation", sector: "一般消費財" },

  { ticker: "WMT", name: "Walmart Inc.", sector: "生活必需品" },
  { ticker: "COST", name: "Costco Wholesale Corporation", sector: "生活必需品" },
  { ticker: "PG", name: "The Procter & Gamble Company", sector: "生活必需品" },
  { ticker: "KO", name: "The Coca-Cola Company", sector: "生活必需品" },
  { ticker: "PEP", name: "PepsiCo, Inc.", sector: "生活必需品" },

  { ticker: "JPM", name: "JPMorgan Chase & Co.", sector: "金融" },
  { ticker: "BAC", name: "Bank of America Corporation", sector: "金融" },
  { ticker: "WFC", name: "Wells Fargo & Company", sector: "金融" },
  { ticker: "GS", name: "The Goldman Sachs Group, Inc.", sector: "金融" },
  { ticker: "V", name: "Visa Inc.", sector: "金融" },
  { ticker: "MA", name: "Mastercard Incorporated", sector: "金融" },
  { ticker: "BRK.B", name: "Berkshire Hathaway Inc. (Class B)", sector: "金融" },

  { ticker: "JNJ", name: "Johnson & Johnson", sector: "ヘルスケア" },
  { ticker: "UNH", name: "UnitedHealth Group Incorporated", sector: "ヘルスケア" },
  { ticker: "LLY", name: "Eli Lilly and Company", sector: "ヘルスケア" },
  { ticker: "ABBV", name: "AbbVie Inc.", sector: "ヘルスケア" },
  { ticker: "MRK", name: "Merck & Co., Inc.", sector: "ヘルスケア" },
  { ticker: "PFE", name: "Pfizer Inc.", sector: "ヘルスケア" },
  { ticker: "TMO", name: "Thermo Fisher Scientific Inc.", sector: "ヘルスケア" },

  { ticker: "XOM", name: "Exxon Mobil Corporation", sector: "エネルギー" },
  { ticker: "CVX", name: "Chevron Corporation", sector: "エネルギー" },
  { ticker: "COP", name: "ConocoPhillips", sector: "エネルギー" },

  { ticker: "BA", name: "The Boeing Company", sector: "資本財" },
  { ticker: "CAT", name: "Caterpillar Inc.", sector: "資本財" },
  { ticker: "GE", name: "GE Aerospace", sector: "資本財" },
  { ticker: "UPS", name: "United Parcel Service, Inc.", sector: "資本財" },

  { ticker: "LIN", name: "Linde plc", sector: "素材" },
  { ticker: "NEE", name: "NextEra Energy, Inc.", sector: "公益" },
  { ticker: "PLD", name: "Prologis, Inc.", sector: "不動産" },
];
