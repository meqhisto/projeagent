import axios from "axios";
import type { ImarSorguSonucu, ImarScraper } from "./types";

const BASE_URL = "https://webgis.canakkale.bel.tr/imardurumu";
const INDEX_URL = `${BASE_URL}/index.aspx`;
const SVC_URL = `${BASE_URL}/service/imarsvc.aspx`;

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

// Secondary call: fetch full imar details by OBJECTID.
// TODO: Confirm the exact type parameter with DevTools (e.g. "detay", "imardurumu").
async function sorguDetay(
  objectId: number,
  nonce: string
): Promise<Record<string, unknown> | null> {
  const url = `${SVC_URL}?type=detay&objectid=${objectId}`;

  try {
    const res = await axios.get(url, {
      headers: {
        ...HEADERS_BASE,
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        "X-Service-Nonce": nonce,
        Referer: INDEX_URL,
        Cookie: `svc_nonce=${nonce}`,
      },
      timeout: 15_000,
    });

    if (!res.data) return null;
    const data = Array.isArray(res.data) ? res.data[0] : res.data;
    return data ?? null;
  } catch {
    // Secondary call is best-effort — return null so primary result still saves
    return null;
  }
}

function parseNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(String(val).replace(",", "."));
  return isNaN(n) ? null : n;
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

    // Base result from first call
    const sonuc: ImarSorguSonucu = {
      ada: String(kayit["ADA"] ?? ada),
      parsel,
      mahalleAdi: (kayit["TAPU_MAH_ADI"] as string) ?? null,
      sourceUrl: `${SVC_URL}?type=adaparsel&adaparsel=${encodeURIComponent(adaparsel)}`,
      hammadde: kayit,
    };

    // Enrich with zoning details if OBJECTID is available
    if (objectId) {
      const detay = await sorguDetay(objectId, nonce);
      if (detay) {
        sonuc.kaks = parseNumber(detay["KAKS"] ?? detay["EMSAL"]);
        sonuc.taks = parseNumber(detay["TAKS"]);
        sonuc.hmax = parseNumber(detay["HMAX"] ?? detay["H_MAX"] ?? detay["YUKSEKLIK"]);
        sonuc.kullanimAmaci =
          (detay["KULLANIM_AMACI"] as string) ??
          (detay["IMAR_DURUMU"] as string) ??
          null;
        sonuc.yapiNizami = (detay["YAPI_NIZAMI"] as string) ?? null;
        sonuc.hammadde = { ...kayit, ...detay };
      }
    }

    return sonuc;
  },
};
