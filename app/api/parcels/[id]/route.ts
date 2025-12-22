import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Auth check
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

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

        // Ownership check - user must be owner, assigned, or admin
        const isOwner = parcel.ownerId === userId;
        const isAssigned = parcel.assignedTo === userId;
        const isUserAdmin = isAdmin((user as any).role as string);

        if (!isOwner && !isAssigned && !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        return NextResponse.json(parcel);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
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
        // Auth check
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const { id } = await params;
        const parcelId = parseInt(id);

        // Verify ownership before update
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
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Update Error:", error);
        return NextResponse.json(
            { error: "Failed to update" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const { id } = await params;
        const parcelId = parseInt(id);

        if (isNaN(parcelId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Check ownership or admin status
        const parcel = await prisma.parcel.findUnique({
            where: { id: parcelId },
            select: { ownerId: true }
        });

        if (!parcel) {
            return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
        }

        const isOwner = parcel.ownerId === userId;
        const isUserAdmin = isAdmin((user as any).role as string);

        if (!isOwner && !isUserAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        await prisma.parcel.delete({
            where: { id: parcelId }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Delete Error:", error);
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Failed to delete parcel" },
            { status: 500 }
        );
    }
}
