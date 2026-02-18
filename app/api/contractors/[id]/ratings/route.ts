import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId } from "@/lib/auth/roleCheck";

// GET - Firma puanlarını getir
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const contractorId = parseInt(id);

        const ratings = await prisma.contractorRating.findMany({
            where: { contractorId },
            include: { rater: { select: { id: true, name: true } } },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(ratings);
    } catch (error) {
        console.error("Error fetching ratings:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Yeni puanlama ekle
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const userId = await getUserId();
        const { id } = await params;
        const contractorId = parseInt(id);
        const body = await request.json();

        // Ortalama puanı hesapla
        const overallScore = (body.reliability + body.quality + body.communication + body.pricing) / 4;

        const rating = await prisma.contractorRating.create({
            data: {
                contractorId,
                reliability: body.reliability || 0,
                quality: body.quality || 0,
                communication: body.communication || 0,
                pricing: body.pricing || 0,
                overallScore,
                comment: body.comment || null,
                ratedBy: userId,
            },
            include: { rater: { select: { id: true, name: true } } }
        });

        return NextResponse.json(rating, { status: 201 });
    } catch (error) {
        console.error("Error creating rating:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
export const runtime = 'nodejs';
