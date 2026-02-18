import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

// GET - Son 5 hesaplamayı getir
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

        // Parselin kullanıcıya ait olduğunu kontrol et
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

        // Son 5 hesaplamayı getir
        const calculations = await prisma.feasibilityCalculation.findMany({
            where: { parcelId },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: {
                id: true,
                arsaM2: true,
                emsal: true,
                katKarsiligiOrani: true,
                ortalamaDaireBrutu: true,
                insaatMaliyeti: true,
                satisFiyati: true,
                bonusFactor: true,
                katAdedi: true,
                toplamDaire: true,
                muteahhitDaire: true,
                arsaSahibiDaire: true,
                netKar: true,
                roi: true,
                durum: true,
                fullResult: true,
                createdAt: true
            }
        });

        return NextResponse.json(calculations);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("GET calculations error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Yeni hesaplama kaydet
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

        // Parselin kullanıcıya ait olduğunu kontrol et
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

        // Gerekli alanları kontrol et
        const requiredFields = [
            "arsaM2", "emsal", "katKarsiligiOrani", "ortalamaDaireBrutu",
            "insaatMaliyeti", "satisFiyati", "toplamDaire", "muteahhitDaire",
            "arsaSahibiDaire", "netKar", "roi", "durum", "fullResult"
        ];

        for (const field of requiredFields) {
            if (body[field] === undefined || body[field] === null) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                );
            }
        }

        // Yeni hesaplama oluştur
        const calculation = await prisma.feasibilityCalculation.create({
            data: {
                parcelId,
                arsaM2: body.arsaM2,
                emsal: body.emsal,
                katKarsiligiOrani: body.katKarsiligiOrani,
                ortalamaDaireBrutu: body.ortalamaDaireBrutu,
                insaatMaliyeti: body.insaatMaliyeti,
                satisFiyati: body.satisFiyati,
                bonusFactor: body.bonusFactor || 1.3,
                katAdedi: body.katAdedi || 5,
                toplamDaire: body.toplamDaire,
                muteahhitDaire: body.muteahhitDaire,
                arsaSahibiDaire: body.arsaSahibiDaire,
                netKar: body.netKar,
                roi: body.roi,
                durum: body.durum,
                fullResult: typeof body.fullResult === "string"
                    ? body.fullResult
                    : JSON.stringify(body.fullResult)
            }
        });

        return NextResponse.json(calculation, { status: 201 });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("POST calculation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Hesaplama sil
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const { searchParams } = new URL(request.url);
        const calculationId = searchParams.get("calculationId");

        if (!calculationId) {
            return NextResponse.json({ error: "Missing calculationId" }, { status: 400 });
        }

        const parcelId = parseInt(params.id);

        // Parselin kullanıcıya ait olduğunu kontrol et
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

        await prisma.feasibilityCalculation.delete({
            where: {
                id: parseInt(calculationId),
                parcelId
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("DELETE calculation error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
export const runtime = 'nodejs';
