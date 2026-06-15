export interface ImarSorguSonucu {
  ada: string;
  parsel: string;
  mahalleAdi?: string | null;
  // Zoning fields — populated by secondary API call if available
  kaks?: number | null;
  taks?: number | null;
  hmax?: number | null;
  kullanimAmaci?: string | null;
  yapiNizami?: string | null;
  notlar?: string | null;
  planGorselUrl?: string | null; // URL of the imar plan map image
  sourceUrl: string;
  hammadde?: Record<string, unknown>;
}

export interface ImarScraper {
  sehirler: string[]; // Normalized city names this scraper handles
  fetch(ada: string, parsel: string): Promise<ImarSorguSonucu | null>;
}
