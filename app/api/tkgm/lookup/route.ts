import { NextRequest, NextResponse } from "next/server";

const TKGM_BASE = "https://cbsapi.tkgm.gov.tr/megsiswebapi.v3.1/api";

const WAF_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Origin": "https://parselsorgu.tkgm.gov.tr",
    "Referer": "https://parselsorgu.tkgm.gov.tr/",
};

// "2.940,78" → 2940.78 (TR sayı formatı)
function parseTRNumber(val: string | undefined | null): number | null {
    if (!val) return null;
    const cleaned = String(val).replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isNaN(n) ? null : n;
}

function polycentroid(coords: number[][][]) {
    const ring = coords[0];
    let sumLon = 0, sumLat = 0;
    for (const [lon, lat] of ring) { sumLon += lon; sumLat += lat; }
    return { lat: sumLat / ring.length, lon: sumLon / ring.length };
}

export async function GET(request: NextRequest) {
    const sp = new URL(request.url).searchParams;
    const mahalleId = sp.get("mahalleId")?.trim();
    const ada = sp.get("ada")?.trim();
    const parsel = sp.get("parsel")?.trim();

    if (!mahalleId || !ada || !parsel) {
        return NextResponse.json({ error: "mahalleId, ada ve parsel zorunlu" }, { status: 400 });
    }
    if (!/^\d+$/.test(mahalleId)) {
        return NextResponse.json({ error: "mahalleId sayısal olmalı" }, { status: 400 });
    }

    try {
        const url = `${TKGM_BASE}/parsel/${mahalleId}/${ada}/${parsel}`;
        const res = await fetch(url, { headers: WAF_HEADERS, cache: "no-store" });

        if (!res.ok) {
            const text = await res.text().catch(() => "");
            const isNotFound = res.status === 404 || text.toLowerCase().includes("bulunamadı");
            return NextResponse.json(
                { error: isNotFound ? "Parsel bulunamadı. Ada/Parsel numaralarını kontrol edin." : `TKGM hatası (${res.status})` },
                { status: isNotFound ? 404 : 502 }
            );
        }

        const feature = await res.json();

        // WAF bazen 200 döner ama HTML verir
        if (!feature?.type || feature.type !== "Feature") {
            return NextResponse.json({ error: "TKGM geçersiz yanıt döndü. Tekrar deneyin." }, { status: 502 });
        }

        const props = feature?.properties ?? {};

        const area = parseTRNumber(props.alan ?? props.yuzolcumu);

        let lat: number | null = null;
        let lon: number | null = null;
        const geom = feature?.geometry;
        if (geom?.type === "Polygon" && Array.isArray(geom.coordinates)) {
            ({ lat, lon } = polycentroid(geom.coordinates));
        } else if (geom?.type === "MultiPolygon" && Array.isArray(geom.coordinates)) {
            ({ lat, lon } = polycentroid(geom.coordinates[0]));
        }

        return NextResponse.json({
            area,
            latitude: lat ? parseFloat(lat.toFixed(6)) : null,
            longitude: lon ? parseFloat(lon.toFixed(6)) : null,
            city: props.ilAd ?? null,
            district: props.ilceAd ?? null,
            neighborhood: props.mahalleAd ?? null,
            nitelik: props.nitelik ?? null,
            geometry: geom ? JSON.stringify(geom) : null,
        });

    } catch (err: any) {
        return NextResponse.json(
            { error: `TKGM bağlantı hatası: ${err.message ?? "bilinmeyen hata"}` },
            { status: 502 }
        );
    }
}
