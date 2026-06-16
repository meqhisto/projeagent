import axios from "axios";
import * as cheerio from "cheerio";
import * as https from "https";
import type { ImarSorguSonucu, ImarScraper } from "./types";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function parseNumber(val: string | undefined): number | null {
  if (!val || val.trim() === "-") return null;
  const direct = parseFloat(val.replace(",", "."));
  if (!isNaN(direct)) return direct;
  const m = val.match(/\(\s*([0-9]+[.,][0-9]*)\s*\)/);
  if (m) return parseFloat(m[1].replace(",", "."));
  return null;
}

function bul(alanlar: Record<string, string>, ...anahtarlar: string[]): string | null {
  for (const k of anahtarlar) {
    for (const [key, val] of Object.entries(alanlar)) {
      if (key.toLowerCase().includes(k.toLowerCase()) && val && val !== "-") return val;
    }
  }
  return null;
}

function bulKaks(alanlar: Record<string, string>): number | null {
  for (const [key, val] of Object.entries(alanlar)) {
    if (/k\.?a\.?k\.?s|emsal/i.test(key)) {
      const parsed = parseNumber(val);
      if (parsed !== null) return parsed;
    }
  }
  return null;
}

// ─── Factory: creates a scraper for any Netcad KEOS-based municipality ────────

export function createKeosScraper(opts: {
  sehirler: string[];
  baseUrl: string;       // e.g. "https://webgis.canakkale.bel.tr/imardurumu"
  rejectTls?: boolean;   // set false for self-signed certs
}): ImarScraper {
  const { sehirler, baseUrl, rejectTls = true } = opts;

  const INDEX_URL = `${baseUrl}/index.aspx`;
  const SVC_URL   = `${baseUrl}/service/imarsvc.aspx`;

  const HEADERS_BASE = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.8",
  };

  const httpsAgent = new https.Agent({ rejectUnauthorized: rejectTls });

  async function getNonce(): Promise<string | null> {
    const res = await axios.get(INDEX_URL, { headers: HEADERS_BASE, timeout: 10_000, httpsAgent });
    const nonceCookie = (res.headers["set-cookie"] ?? []).find((c: string) => c.startsWith("svc_nonce="));
    if (!nonceCookie) return null;
    return nonceCookie.split("=")[1].split(";")[0];
  }

  async function sorguAdaParsel(adaparsel: string, nonce: string) {
    const res = await axios.get(`${SVC_URL}?type=adaparsel&adaparsel=${encodeURIComponent(adaparsel)}`, {
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
      httpsAgent,
    });
    if (!Array.isArray(res.data) || res.data.length === 0) return null;
    return res.data as Record<string, unknown>[];
  }

  async function sorguImarDetay(objectId: number, nonce: string) {
    const imarUrl = `${baseUrl}/imar.aspx?parselid=${objectId}`;
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
        httpsAgent,
      });

      const $ = cheerio.load(res.data as string);
      const alanlar: Record<string, string> = {};

      // Primary: div-based table (.divTableCellLabel / .divTableContent)
      $(".divTableRow").each((_, row) => {
        const label = $(row).find(".divTableCellLabel").first().text().trim().replace(/:$/, "");
        const value = $(row).find(".divTableContent").first().text().trim();
        if (label) alanlar[label] = value;
      });

      // Fallback: standard <table>
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

      return { alanlar, imarUrl };
    } catch (err) {
      console.warn(`[imar/keos:${sehirler[0]}] imar.aspx parse hatası:`, err);
      return null;
    }
  }

  return {
    sehirler,
    async fetch(ada: string, parsel: string): Promise<ImarSorguSonucu | null> {
      const adaparsel = `${ada}/${parsel}`;

      const nonce = await getNonce();
      if (!nonce) {
        console.error(`[imar/keos:${sehirler[0]}] Nonce alınamadı`);
        return null;
      }

      const kayitlar = await sorguAdaParsel(adaparsel, nonce);
      if (!kayitlar) {
        console.warn(`[imar/keos:${sehirler[0]}] ${adaparsel} için kayıt bulunamadı`);
        return null;
      }

      const kayit = kayitlar[0];
      const objectId = kayit["OBJECTID"] as number | undefined;
      const imarUrl = objectId
        ? `${baseUrl}/imar.aspx?parselid=${objectId}`
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

      const { alanlar } = detay;

      sonuc.kaks = bulKaks(alanlar);
      sonuc.taks = parseNumber(bul(alanlar, "T.A.K.S", "taks") ?? undefined);
      sonuc.hmax = parseNumber(bul(alanlar, "Bina Yüksekliği", "yükseklik", "hmax", "h maks") ?? undefined);
      // kullanimAmaci: kısa (≤60 karakter) fonksiyon adı — uzun plan notlarını hariç tut
      const fonk = bul(alanlar, "Fonksiyon", "kullanım amacı", "kullanim amaci", "imar durumu", "fonk");
      sonuc.kullanimAmaci = fonk && fonk.length <= 60 ? fonk : null;
      sonuc.yapiNizami = bul(alanlar, "İnşaat Nizamı", "insaat nizami", "yapı nizamı", "yapi nizami", "nizam");
      sonuc.notlar = bul(alanlar, "Açıklama", "aciklama", "not");
      // Mahalle fallback: HTML'den de dene (Biga: "Tapu Kütüğü"/"İdari Mahalle", Gelibolu: "Tapu Mahalle")
      if (!sonuc.mahalleAdi || sonuc.mahalleAdi === "-") {
        sonuc.mahalleAdi =
          bul(alanlar, "Tapu Kütüğü", "tapu kutugu") ??
          bul(alanlar, "İdari Mahalle", "idari mahalle") ??
          bul(alanlar, "Tapu Mahalle", "tapu mahalle") ??
          null;
      }
      sonuc.hammadde = { ...kayit, ...alanlar };

      return sonuc;
    },
  };
}

// ─── Instantiated scrapers ────────────────────────────────────────────────────

export const canakkaleScraper = createKeosScraper({
  sehirler: ["çanakkale", "canakkale"],
  baseUrl: "https://webgis.canakkale.bel.tr/imardurumu",
});

export const bigaScraper = createKeosScraper({
  sehirler: ["biga"],
  baseUrl: "https://keos.biga.bel.tr/imardurumu",
});

export const gelibolouScraper = createKeosScraper({
  sehirler: ["gelibolu"],
  baseUrl: "https://keos.gelibolu.bel.tr/imardurumu",
  rejectTls: false,
});
