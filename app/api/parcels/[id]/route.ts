import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const parcelId = parseInt(id);

        if (isNaN(parcelId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const parcel = await prisma.parcel.findUnique({
            where: { id: parcelId },
            include: {
                images: true,
                zoning: true,
                notes: {
                    orderBy: { createdAt: 'desc' }
                }
            },
        });

        if (!parcel) {
            return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
        }

        return NextResponse.json(parcel);
    } catch (error) {
        console.error("Fetch Parcel Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch parcel" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const parcelId = parseInt(id);
        const body = await request.json();
        const { crmStage, ks, taks, maxHeight, zoningType, notes } = body;

        // 1. Update Parcel Fields (CRM Stage)
        if (crmStage) {
            await prisma.parcel.update({
                where: { id: parcelId },
                data: { crmStage }
            });
        }

        // 2. Update Zoning Info (if provided)
        if (ks !== undefined || taks !== undefined || maxHeight !== undefined || zoningType !== undefined || notes !== undefined) {
            await prisma.zoningInfo.upsert({
                where: { parcelId },
                update: {
                    ks: ks !== undefined ? parseFloat(ks) : undefined,
                    taks: taks !== undefined ? parseFloat(taks) : undefined,
                    maxHeight: maxHeight !== undefined ? parseFloat(maxHeight) : undefined,
                    zoningType,
                    notes
                },
                create: {
                    parcelId,
                    ks: parseFloat(ks) || 0,
                    taks: parseFloat(taks) || 0,
                    maxHeight: parseFloat(maxHeight) || 0,
                    zoningType: zoningType || "Konut",
                    notes
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Update Error:", error);
        return NextResponse.json(
            { error: "Failed to update" },
            { status: 500 }
        );
    }
}
