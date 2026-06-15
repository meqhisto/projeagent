import type { ImarScraper, ImarSorguSonucu } from "./types";
import { canakkaleScraper } from "./canakkale";

const SCRAPERS: ImarScraper[] = [
  canakkaleScraper,
  // Yeni belediye scraperları buraya eklenir:
  // istanbulScraper,
  // izmir Scraper,
];

// Normalize: lowercase + remove Turkish-to-ASCII for matching
function normalize(sehir: string): string {
  return sehir
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function getScraper(sehir: string): ImarScraper | null {
  const norm = normalize(sehir);
  return (
    SCRAPERS.find((s) =>
      s.sehirler.some((s2) => normalize(s2) === norm)
    ) ?? null
  );
}

export async function fetchImarDurumu(
  sehir: string,
  ada: string,
  parsel: string
): Promise<ImarSorguSonucu | null> {
  const scraper = getScraper(sehir);
  if (!scraper) {
    console.info(`[imar/registry] "${sehir}" için scraper bulunamadı`);
    return null;
  }
  return scraper.fetch(ada, parsel);
}
