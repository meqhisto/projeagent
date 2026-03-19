import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId } from "@/lib/auth/roleCheck";

// GET - Tekil firma detayı
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const contractorId = parseInt(id);

        const contractor = await prisma.contractor.findUnique({
            where: { id: contractorId },
            include: {
                ratings: {
                    include: { rater: { select: { id: true, name: true } } },
                    orderBy: { createdAt: "desc" }
                },
                matches: {
                    include: {
                        parcel: true,
                        customer: true,
                    },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!contractor) {
            return NextResponse.json({ error: "Contractor not found" }, { status: 404 });
        }

        // Ortalama puan hesapla
        const avgScore = contractor.ratings.length > 0
            ? contractor.ratings.reduce((sum, r) => sum + ((r.reliability + r.quality + r.communication + r.pricing) / 4), 0) / contractor.ratings.length
            : null;

        return NextResponse.json({ ...contractor, averageScore: avgScore });
    } catch (error) {
        console.error("Error fetching contractor:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PATCH - Firma güncelle
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const contractorId = parseInt(id);
        const body = await request.json();

        const contractor = await prisma.contractor.update({
            where: { id: contractorId },
            data: {
                name: body.name,
                authorizedPerson: body.authorizedPerson,
                phone: body.phone,
                email: body.email,
                address: body.address,
                website: body.website,
                taxNumber: body.taxNumber,
                specialties: body.specialties,
                notes: body.notes,
            }
        });

        return NextResponse.json(contractor);
    } catch (error) {
        console.error("Error updating contractor:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Firma sil
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const contractorId = parseInt(id);

        await prisma.contractor.delete({
            where: { id: contractorId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting contractor:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
