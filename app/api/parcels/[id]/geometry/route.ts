import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth.config";

// GET — return stored geometry or fetch from TKGM
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const parcel = await prisma.parcel.findUnique({
        where: { id: parseInt(id) },
        select: { geometry: true, latitude: true, longitude: true },
    });
    if (!parcel) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Return stored geometry if available
    if (parcel.geometry) {
        return NextResponse.json({ geometry: JSON.parse(parcel.geometry), source: "stored" });
    }

    // Try to fetch from TKGM CBS API using coordinate
    if (!parcel.latitude || !parcel.longitude) {
        return NextResponse.json({ geometry: null, source: "none" });
    }

    try {
        const tkgmUrl = `https://cbsservis.tkgm.gov.tr/megsiswebapi.3/api/parcel/getParcelByCoordinate?x=${parcel.longitude}&y=${parcel.latitude}&epsgio=4326`;
        const res = await fetch(tkgmUrl, {
            headers: { "Accept": "application/json" },
            signal: AbortSignal.timeout(8000),
        });

        if (!res.ok) return NextResponse.json({ geometry: null, source: "tkgm_error" });

        const data = await res.json();

        // TKGM returns a FeatureCollection or Feature
        const feature = data?.features?.[0] ?? data;
        if (!feature?.geometry) return NextResponse.json({ geometry: null, source: "tkgm_empty" });

        // Save to DB for future use
        await prisma.parcel.update({
            where: { id: parseInt(id) },
            data: { geometry: JSON.stringify(feature.geometry) },
        });

        return NextResponse.json({ geometry: feature.geometry, source: "tkgm" });
    } catch {
        return NextResponse.json({ geometry: null, source: "tkgm_error" });
    }
}

// PUT — save manually drawn geometry
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { geometry } = await req.json();

    await prisma.parcel.update({
        where: { id: parseInt(id) },
        data: { geometry: geometry ? JSON.stringify(geometry) : null },
    });

    return NextResponse.json({ ok: true });
}

// DELETE — clear stored geometry
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await prisma.parcel.update({
        where: { id: parseInt(id) },
        data: { geometry: null },
    });

    return NextResponse.json({ ok: true });
}
