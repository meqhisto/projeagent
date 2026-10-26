import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, resolveUserId, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = "nodejs";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Auth check
        const user = await requireAuth();
        const userId = await resolveUserId(user);

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
                },
                shares: { where: { userId } }
            },
        });

        if (!parcel) {
            return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
        }

        const isOwner = parcel.ownerId === userId;
        const isAssigned = parcel.assignedTo === userId;
        const isUserAdmin = isAdmin((user as any).role as string);
        const isShared = parcel.shares.length > 0;

        if (!isOwner && !isAssigned && !isUserAdmin && !isShared) {
            // Onaylı erişim talebi var mı?
            const accessReq = await prisma.accessRequest.findFirst({
                where: { requesterId: userId, parcelId, status: "APPROVED" },
            });

            if (!accessReq) {
                // Bekleyen talep var mı bildirsin
                const pendingReq = await prisma.accessRequest.findFirst({
                    where: { requesterId: userId, parcelId },
                    select: { id: true, status: true },
                });
                return NextResponse.json(
                    { error: "Unauthorized", accessRequestStatus: pendingReq?.status ?? null },
                    { status: 403 }
                );
            }

            // Onaylı erişim: sadece izin verilen alanları döndür
            const filtered: Record<string, unknown> = {
                id: parcel.id,
                city: parcel.city,
                district: parcel.district,
                neighborhood: parcel.neighborhood,
                island: parcel.island,
                parsel: parcel.parsel,
                category: parcel.category,
                status: parcel.status,
                images: parcel.images,
                _accessRequest: accessReq,
                _isFiltered: true,
            };
            if (accessReq.shareArea)     filtered.area = parcel.area;
            if (accessReq.shareZoning)   filtered.zoning = parcel.zoning;
            if (accessReq.sharePrice)    filtered.askingPrice = parcel.askingPrice;
            if (accessReq.shareNotes)    filtered.notes = parcel.notes;
            if (accessReq.shareCrmStage) filtered.crmStage = parcel.crmStage;

            return NextResponse.json(filtered);
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
        const userId = await resolveUserId(user);

        const { id } = await params;
        const parcelId = parseInt(id);

        // Verify ownership before update
        const parcel = await prisma.parcel.findUnique({
            where: { id: parcelId },
            select: {
                ownerId: true,
                assignedTo: true,
                shares: { where: { userId, permission: "EDIT" } }
            }
        });

        if (!parcel) {
            return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
        }

        const isOwner = parcel.ownerId === userId;
        const isAssigned = parcel.assignedTo === userId;
        const isUserAdmin = isAdmin((user as any).role as string);
        const isSharedWithEdit = parcel.shares.length > 0;

        if (!isOwner && !isAssigned && !isUserAdmin && !isSharedWithEdit) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await request.json();
        const { crmStage, ks, taks, maxHeight, zoningType, notes, category, tags, askingPrice } = body;

        // 1. Update Parcel Fields (CRM Stage, Category, Tags, AskingPrice)
        const parcelUpdateData: any = {};
        if (crmStage) parcelUpdateData.crmStage = crmStage;
        if (category) parcelUpdateData.category = category;
        if (tags !== undefined) parcelUpdateData.tags = tags;
        if (askingPrice !== undefined) {
            parcelUpdateData.askingPrice = askingPrice === null ? null : parseFloat(String(askingPrice));
        }

        if (Object.keys(parcelUpdateData).length > 0) {
            await prisma.parcel.update({
                where: { id: parcelId },
                data: parcelUpdateData
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
