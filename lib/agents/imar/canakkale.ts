import axios from "axios";
import * as cheerio from "cheerio";
import type { ImarSorguSonucu, ImarScraper } from "./types";

const BASE_URL = "https://webgis.canakkale.bel.tr/imardurumu";
const INDEX_URL = `${BASE_URL}/index.aspx`;
const SVC_URL = `${BASE_URL}/service/imarsvc.aspx`;
const MAP_SVC_URL = `${BASE_URL}/service/mapservice.aspx`;

const HEADERS_BASE = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
};

async function getNonce(): Promise<string | null> {
  const res = await axios.get(INDEX_URL, {
    headers: HEADERS_BASE,
    timeout: 10_000,
  });

  const setCookieHeader = res.headers["set-cookie"];
  if (!setCookieHeader) return null;

  const nonceCookie = setCookieHeader.find((c: string) =>
    c.startsWith("svc_nonce=")
  );
  if (!nonceCookie) return null;

  return nonceCookie.split("=")[1].split(";")[0];
}

async function sorguAdaParsel(
  adaparsel: string,
  nonce: string
): Promise<Record<string, unknown>[] | null> {
  const url = `${SVC_URL}?type=adaparsel&adaparsel=${encodeURIComponent(adaparsel)}`;

  const res = await axios.get(url, {
    headers: {
      ...HEADERS_BASE,
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      "X-Service-Nonce": nonce,
      Referer: INDEX_URL,
      Cookie: `svc_nonce=${nonce}`,
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    timeout: 15_000,
  });

  if (!Array.isArray(res.data) || res.data.length === 0) return null;
  return res.data;
}

interface ImarDetay {
  alanlar: Record<string, string>;
  planGorselUrl: string | null;
}

// Fetches imar.aspx?parselid={objectId}, parses HTML table rows,
// and extracts the map token for the plan image.
async function sorguImarDetay(
  objectId: number,
  nonce: string
): Promise<ImarDetay | null> {
  const imarUrl = `${BASE_URL}/imar.aspx?parselid=${objectId}`;

  try {
    const res = await axios.get(imarUrl, {
      headers: {
        ...HEADERS_BASE,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "X-Service-Nonce": nonce,
        Referer: INDEX_URL,
        Cookie: `svc_nonce=${nonce}`,
      },
      timeout: 15_000,
    });

    const $ = cheerio.load(res.data as string);
    const alanlar: Record<string, string> = {};

    // Extract key-value pairs from all table rows
    $("table tr").each((_, row) => {
      const hucre = $(row).find("td");
      if (hucre.length >= 2) {
        const anahtar = $(hucre[0]).text().trim().replace(/:$/, "");
        const deger = $(hucre[1]).text().trim();
        if (anahtar && deger) {
          alanlar[anahtar] = deger;
        }
      }
    });

    // Also check definition lists (<dl><dt>/<dd>) used by some municipalities
    $("dl").each((_, dl) => {
      const dts = $(dl).find("dt");
      const dds = $(dl).find("dd");
      dts.each((i, dt) => {
        const anahtar = $(dt).text().trim().replace(/:$/, "");
        const deger = $(dds[i])?.text().trim() ?? "";
        if (anahtar && deger) alanlar[anahtar] = deger;
      });
    });

    // Extract map token from script tags or data attributes
    // Pattern: mapservice.aspx?token=<uuid>
    let planGorselUrl: string | null = null;
    const html = res.data as string;
    const tokenMatch = html.match(/mapservice\.aspx\?token=([a-f0-9-]{36})/i);
    if (tokenMatch) {
      planGorselUrl = `${MAP_SVC_URL}?token=${tokenMatch[1]}&maptype=plan&level=0&bbox=`;
    }

    return { alanlar, planGorselUrl };
  } catch (err) {
    console.warn("[imar/canakkale] imar.aspx parse hatası:", err);
    return null;
  }
}

function parseNumber(val: string | undefined): number | null {
  if (!val) return null;
  const n = parseFloat(val.replace(",", "."));
  return isNaN(n) ? null : n;
}

// Tries multiple Turkish field name variants for a given concept.
function bul(alanlar: Record<string, string>, ...anahtarlar: string[]): string | null {
  for (const k of anahtarlar) {
    for (const [key, val] of Object.entries(alanlar)) {
      if (key.toLowerCase().includes(k.toLowerCase()) && val) return val;
    }
  }
  return null;
}

export const canakkaleScraper: ImarScraper = {
  sehirler: ["çanakkale", "canakkale"],

  async fetch(ada: string, parsel: string): Promise<ImarSorguSonucu | null> {
    const adaparsel = `${ada}/${parsel}`;

    const nonce = await getNonce();
    if (!nonce) {
      console.error("[imar/canakkale] Nonce alınamadı");
      return null;
    }

    const kayitlar = await sorguAdaParsel(adaparsel, nonce);
    if (!kayitlar) {
      console.warn(`[imar/canakkale] ${adaparsel} için kayıt bulunamadı`);
      return null;
    }

    const kayit = kayitlar[0];
    const objectId = kayit["OBJECTID"] as number | undefined;
    const imarUrl = objectId
      ? `${BASE_URL}/imar.aspx?parselid=${objectId}`
      : `${SVC_URL}?type=adaparsel&adaparsel=${encodeURIComponent(adaparsel)}`;

    const sonuc: ImarSorguSonucu = {
      ada: String(kayit["ADA"] ?? ada),
      parsel,
      mahalleAdi: (kayit["TAPU_MAH_ADI"] as string) ?? null,
      sourceUrl: imarUrl,
      hammadde: { ...kayit },
    };

    if (!objectId) return sonuc;

    const detay = await sorguImarDetay(objectId, nonce);
    if (!detay) return sonuc;

    const { alanlar, planGorselUrl } = detay;

    sonuc.kaks = parseNumber(bul(alanlar, "kaks", "emsal") ?? undefined);
    sonuc.taks = parseNumber(bul(alanlar, "taks") ?? undefined);
    sonuc.hmax = parseNumber(bul(alanlar, "hmax", "yükseklik", "yukseklik") ?? undefined);
    sonuc.kullanimAmaci = bul(alanlar, "kullanım", "kullanim", "imar durumu", "imardurumu", "fonksiyon");
    sonuc.yapiNizami = bul(alanlar, "yapı nizamı", "yapi nizami", "nizam");
    sonuc.notlar = bul(alanlar, "not", "açıklama", "aciklama");
    sonuc.planGorselUrl = planGorselUrl;
    sonuc.hammadde = { ...kayit, ...alanlar };

    return sonuc;
  },
};
