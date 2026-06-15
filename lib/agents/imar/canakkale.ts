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

// Çanakkale WebGIS imar.aspx'i standart <table> değil, div-based custom grid kullanır:
//   .divTableCellLabel  →  alan adı
//   .divTableContent    →  değer
// Ayrıca #htmlOutput içinde tüm çıktı birleşik olarak yer alır.
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

    // Primary: div-based table (.divTableCellLabel / .divTableContent)
    $(".divTableRow").each((_, row) => {
      const label = $(row).find(".divTableCellLabel").first().text().trim().replace(/:$/, "");
      const value = $(row).find(".divTableContent").first().text().trim();
      if (label && value && value !== "-") {
        alanlar[label] = value;
      } else if (label && value) {
        // Keep "-" values too so we know the field exists
        alanlar[label] = value;
      }
    });

    // Fallback: standard <table tr td> (for other municipalities reusing this code)
    $("table tr").each((_, row) => {
      const cells = $(row).find("td");
      if (cells.length >= 2) {
        const label = $(cells[0]).text().trim().replace(/:$/, "");
        const value = $(cells[1]).text().trim();
        if (label && value && !alanlar[label]) alanlar[label] = value;
      }
    });

    // dl/dt/dd fallback
    $("dl").each((_, dl) => {
      const dts = $(dl).find("dt");
      const dds = $(dl).find("dd");
      dts.each((i, dt) => {
        const label = $(dt).text().trim().replace(/:$/, "");
        const value = $(dds[i])?.text().trim() ?? "";
        if (label && value && !alanlar[label]) alanlar[label] = value;
      });
    });

    // Map token from script/src attributes
    let planGorselUrl: string | null = null;
    const html = res.data as string;
    const tokenMatch = html.match(/mapservice\.aspx\?token=([a-f0-9-]{30,40})/i);
    if (tokenMatch) {
      planGorselUrl = `${MAP_SVC_URL}?token=${tokenMatch[1]}&maptype=plan&level=0&bbox=`;
    }

    return { alanlar, planGorselUrl };
  } catch (err) {
    console.warn("[imar/canakkale] imar.aspx parse hatası:", err);
    return null;
  }
}

// Sayısal değer çevirir.
// "24.50" → 24.5
// "- (2.40)" → 2.40  (parantez içindeki ikincil değer)
// "-" → null
function parseNumber(val: string | undefined): number | null {
  if (!val || val.trim() === "-") return null;
  const direct = parseFloat(val.replace(",", "."));
  if (!isNaN(direct)) return direct;
  // Parenthesized secondary value: "- (2.40)"
  const m = val.match(/\(\s*([0-9]+[.,][0-9]*)\s*\)/);
  if (m) return parseFloat(m[1].replace(",", "."));
  return null;
}

// Alan adına göre alanlar dict'inden değer arar (büyük/küçük harf ve Türkçe duyarsız).
function bul(alanlar: Record<string, string>, ...anahtarlar: string[]): string | null {
  for (const k of anahtarlar) {
    for (const [key, val] of Object.entries(alanlar)) {
      if (key.toLowerCase().includes(k.toLowerCase()) && val && val !== "-") {
        return val;
      }
    }
  }
  return null;
}

// K.A.K.S için özel arama: önce direkt değer, yoksa parantezli form dener.
function bulKaks(alanlar: Record<string, string>): number | null {
  for (const [key, val] of Object.entries(alanlar)) {
    if (/k\.?a\.?k\.?s|emsal/i.test(key)) {
      const parsed = parseNumber(val);
      if (parsed !== null) return parsed;
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

    // Çanakkale WebGIS gerçek alan adları (imar.aspx divTableCellLabel):
    //   "Bina Yüksekliği"  → Hmax
    //   "T.A.K.S"          → TAKS
    //   "K.A.K.S (Emsal)"  → KAKS (değer "-" ise parantez içi 2.40 kullanılır)
    //   "Fonksiyon"        → Kullanım amacı (Konut Alanı, Ticari Alan, vb.)
    //   "İnşaat Nizamı"    → Yapı nizamı
    //   "Açıklama"         → Notlar
    sonuc.kaks = bulKaks(alanlar);
    sonuc.taks = parseNumber(bul(alanlar, "T.A.K.S", "taks") ?? undefined);
    sonuc.hmax = parseNumber(bul(alanlar, "Bina Yüksekliği", "yükseklik", "hmax", "h maks") ?? undefined);
    sonuc.kullanimAmaci = bul(alanlar, "Fonksiyon", "kullanım amacı", "kullanim amaci", "imar durumu", "fonk");
    sonuc.yapiNizami = bul(alanlar, "İnşaat Nizamı", "insaat nizami", "yapı nizamı", "yapi nizami", "nizam");
    sonuc.notlar = bul(alanlar, "Açıklama", "aciklama", "not");
    sonuc.planGorselUrl = planGorselUrl;
    sonuc.hammadde = { ...kayit, ...alanlar };

    return sonuc;
  },
};
