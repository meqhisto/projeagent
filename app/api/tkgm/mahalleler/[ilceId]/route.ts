import { NextRequest, NextResponse } from "next/server";

const WAF_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Origin": "https://parselsorgu.tkgm.gov.tr",
    "Referer": "https://parselsorgu.tkgm.gov.tr/",
};

export async function GET(_req: NextRequest, props: { params: Promise<{ ilceId: string }> }) {
    const { ilceId } = await props.params;
    if (!/^\d+$/.test(ilceId)) {
        return NextResponse.json({ error: "Geçersiz ilçe ID" }, { status: 400 });
    }

    try {
        const res = await fetch(
            `https://cbsapi.tkgm.gov.tr/megsiswebapi.v3.1/api/idariYapi/mahalleListe/${ilceId}`,
            { headers: WAF_HEADERS, cache: "no-store" }
        );
        if (!res.ok) return NextResponse.json({ error: "Mahalle listesi alınamadı" }, { status: 502 });

        const geojson = await res.json();
        const items = (geojson.features ?? []).map((f: any) => ({
            id: f.properties.id,
            text: f.properties.text,
        })).sort((a: any, b: any) => a.text.localeCompare(b.text, "tr"));

        return NextResponse.json(items);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 502 });
    }
}
