import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = "nodejs";
import { valueParcel } from "@/lib/valuation";
import { ValuationQuerySchema } from "@/lib/validations";

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

        const parcel = await prisma.parcel.findUnique({
            where: { id: parcelId },
            select: {
                ownerId: true,
                assignedTo: true,
                shares: { select: { userId: true } },
            },
        });

        if (!parcel) {
            return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
        }

        const isOwner = parcel.ownerId === userId;
        const isAssigned = parcel.assignedTo === userId;
        const isUserAdmin = isAdmin((user as any).role as string);
        const isShared = parcel.shares.some(s => s.userId === userId);

        if (!isOwner && !isAssigned && !isUserAdmin && !isShared) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const queryParsed = ValuationQuerySchema.safeParse({
            radiusKm: searchParams.get("radiusKm") ?? undefined,
        });
        const radiusKm = queryParsed.success ? queryParsed.data.radiusKm : 5;

        const result = await valueParcel(parcelId, { radiusKm });
        return NextResponse.json(result);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Valuation Error:", error);
        return NextResponse.json(
            { error: "Değerleme hesaplanamadı", details: error.message },
            { status: 500 }
        );
    }
}
