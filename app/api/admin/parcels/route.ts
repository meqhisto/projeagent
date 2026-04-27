import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/roleCheck";

export async function GET(request: Request) {
    try {
        await requireAdmin();
        const { searchParams } = new URL(request.url);
        const ownerId = searchParams.get("ownerId");

        const parcels = await prisma.parcel.findMany({
            where: ownerId ? { ownerId: parseInt(ownerId) } : {},
            orderBy: { createdAt: "desc" },
            include: {
                owner: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } },
                shares: {
                    include: { user: { select: { id: true, name: true, email: true } } },
                },
                zoning: true,
            },
        });
        return NextResponse.json(parcels);
    } catch (error: any) {
        if (error.message === "Unauthorized" || error.message === "Admin access required")
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
