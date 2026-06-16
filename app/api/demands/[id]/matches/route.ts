import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireAuth();
        const userId = await getUserId();
        const { id } = await params;
        const demandId = Number(id);

        const demand = await prisma.demandRequest.findUnique({ where: { id: demandId } });
        if (!demand) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
        if (!isAdmin(user.role as string) && demand.createdById !== userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const matches = await prisma.demandMatch.findMany({
            where: { demandId },
            orderBy: { score: "desc" },
            include: {
                parcel: {
                    select: {
                        id: true, city: true, district: true, neighborhood: true,
                        island: true, parsel: true, area: true, askingPrice: true,
                        category: true, zoning: true, images: { where: { isDefault: true }, take: 1 },
                    },
                },
                property: {
                    select: {
                        id: true, title: true, type: true, city: true, district: true,
                        neighborhood: true, netArea: true, grossArea: true,
                        listingPrice: true, currentValue: true, roomType: true,
                        images: { where: { isDefault: true }, take: 1 },
                    },
                },
            },
        });

        return NextResponse.json(matches);
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Eşleşmeler alınamadı" }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireAuth();
        const userId = await getUserId();
        const { id } = await params;

        const body = await request.json();
        const { matchId, status } = body;

        const validStatuses = ["SUGGESTED", "VIEWED", "PRESENTED", "ACCEPTED", "REJECTED"];
        if (!matchId || !validStatuses.includes(status)) {
            return NextResponse.json({ error: "Geçersiz parametreler" }, { status: 400 });
        }

        const match = await prisma.demandMatch.findUnique({
            where: { id: matchId },
            include: { demand: true },
        });

        if (!match) return NextResponse.json({ error: "Eşleşme bulunamadı" }, { status: 404 });
        if (!isAdmin(user.role as string) && match.demand.createdById !== userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const updated = await prisma.demandMatch.update({
            where: { id: matchId },
            data: { status },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Eşleşme güncellenemedi" }, { status: 500 });
    }
}
