import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/roleCheck";

// GET - Firma eşleştirmelerini getir
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const contractorId = parseInt(id);

        const matches = await prisma.contractorParcelMatch.findMany({
            where: { contractorId },
            include: {
                parcel: true,
                customer: true,
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(matches);
    } catch (error) {
        console.error("Error fetching matches:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Yeni eşleştirme oluştur
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const contractorId = parseInt(id);
        const body = await request.json();

        const match = await prisma.contractorParcelMatch.create({
            data: {
                contractorId,
                parcelId: body.parcelId,
                customerId: body.customerId || null,
                status: body.status || "PLANNED",
                meetingDate: body.meetingDate ? new Date(body.meetingDate) : null,
                offerAmount: body.offerAmount || null,
                notes: body.notes || null,
            },
            include: {
                parcel: true,
                customer: true,
            }
        });

        return NextResponse.json(match, { status: 201 });
    } catch (error) {
        console.error("Error creating match:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Eşleştirme güncelle
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const body = await request.json();

        const match = await prisma.contractorParcelMatch.update({
            where: { id: body.matchId },
            data: {
                status: body.status,
                meetingDate: body.meetingDate ? new Date(body.meetingDate) : undefined,
                offerAmount: body.offerAmount,
                notes: body.notes,
            },
            include: {
                parcel: true,
                customer: true,
            }
        });

        return NextResponse.json(match);
    } catch (error) {
        console.error("Error updating match:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
