export type TickerEntry = {
  cik: string;
  ticker: string;
  name: string;
};

export type CompanyInfo = {
  cik: string;
  name: string;
  ticker: string | null;
  sic: string | null;
  sicDescription: string | null;
  exchange: string | null;
  category: string | null;
  fiscalYearEnd: string | null;
  addresses?: unknown;
};

export type Filing = {
  accessionNo: string;
  formType: string;
  filedAt: string;
  reportDate: string | null;
  primaryDocument: string;
  primaryDocDescription: string | null;
  primaryDocUrl: string;
  filingIndexUrl: string;
};
