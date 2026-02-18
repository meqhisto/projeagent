import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

// GET - Parsel için emsalleri listele
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        const parcelId = parseInt(params.id);

        if (isNaN(parcelId)) {
            return NextResponse.json({ error: "Invalid parcel ID" }, { status: 400 });
        }

        // Yetki kontrolü (sadece okuma için parcel'e erişimi olması yeterli mi? Evet)
        const parcel = await prisma.parcel.findUnique({
            where: { id: parcelId },
            select: { ownerId: true, assignedTo: true }
        });

        if (!parcel) {
            return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
        }

        const isOwner = parcel.ownerId === userId;
        const isAssigned = parcel.assignedTo === userId;
        const isUserAdmin = isAdmin((user as any).role as string);

        if (!isOwner && !isAssigned && !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const precedents = await prisma.parcelPrecedent.findMany({
            where: { parcelId },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(precedents);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("GET precedents error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Yeni emsal ekle
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        const parcelId = parseInt(params.id);

        if (isNaN(parcelId)) {
            return NextResponse.json({ error: "Invalid parcel ID" }, { status: 400 });
        }

        // Yetki kontrolü
        const parcel = await prisma.parcel.findUnique({
            where: { id: parcelId },
            select: { ownerId: true, assignedTo: true }
        });

        if (!parcel) {
            return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
        }

        const isOwner = parcel.ownerId === userId;
        const isAssigned = parcel.assignedTo === userId;
        const isUserAdmin = isAdmin((user as any).role as string);

        if (!isOwner && !isAssigned && !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { title, price, area, sourceUrl, source, notes } = body;

        if (!title || !price) {
            return NextResponse.json({ error: "Title and price are required" }, { status: 400 });
        }

        // m² fiyatını hesapla
        let pricePerM2 = null;
        if (area && area > 0) {
            pricePerM2 = price / area;
        }

        const precedent = await prisma.parcelPrecedent.create({
            data: {
                parcelId,
                title,
                price: parseFloat(price.toString()),
                area: area ? parseFloat(area.toString()) : null,
                pricePerM2,
                sourceUrl,
                source: source || "manuel",
                notes
            }
        });

        return NextResponse.json(precedent, { status: 201 });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("POST precedent error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Emsal sil
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        const parcelId = parseInt(params.id);

        const { searchParams } = new URL(request.url);
        const precedentId = searchParams.get("precedentId");

        if (!precedentId) {
            return NextResponse.json({ error: "Missing precedentId" }, { status: 400 });
        }

        // Yetki kontrolü
        const parcel = await prisma.parcel.findUnique({
            where: { id: parcelId },
            select: { ownerId: true, assignedTo: true }
        });

        if (!parcel) {
            return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
        }

        const isOwner = parcel.ownerId === userId;
        const isAssigned = parcel.assignedTo === userId;
        const isUserAdmin = isAdmin((user as any).role as string);

        if (!isOwner && !isAssigned && !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.parcelPrecedent.delete({
            where: { id: parseInt(precedentId) }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("DELETE precedent error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
export const runtime = 'nodejs';
