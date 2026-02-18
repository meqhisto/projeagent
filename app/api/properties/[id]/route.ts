import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";

// GET /api/properties/[id] - Gayrimenkul detayını getir
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        const { id } = await params;
        const propertyId = parseInt(id);

        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            include: {
                images: true,
                parcel: {
                    include: {
                        images: true,
                        zoning: true,
                    }
                },
                units: {
                    include: {
                        tenant: true,
                    },
                    orderBy: { unitNumber: "asc" }
                },
                transactions: {
                    orderBy: { date: "desc" },
                    take: 20,
                },
                valuations: {
                    orderBy: { date: "desc" },
                },
                owner: {
                    select: { id: true, name: true, email: true }
                }
            },
        });

        if (!property) {
            return NextResponse.json(
                { error: "Gayrimenkul bulunamadı" },
                { status: 404 }
            );
        }

        // Authorization check
        if (!isAdmin((user as any).role) && property.ownerId !== userId) {
            return NextResponse.json(
                { error: "Bu gayrimenkülü görüntüleme yetkiniz yok" },
                { status: 403 }
            );
        }

        return NextResponse.json(property);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("GET /api/properties/[id] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch property" },
            { status: 500 }
        );
    }
}

// PATCH /api/properties/[id] - Gayrimenkul güncelle
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        const { id } = await params;
        const propertyId = parseInt(id);

        // Check ownership
        const existing = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { ownerId: true }
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Gayrimenkul bulunamadı" },
                { status: 404 }
            );
        }

        if (!isAdmin((user as any).role) && existing.ownerId !== userId) {
            return NextResponse.json(
                { error: "Bu gayrimenkülü düzenleme yetkiniz yok" },
                { status: 403 }
            );
        }

        const body = await request.json();

        // Filter updateable fields
        const updateData: any = {};
        const allowedFields = [
            'title', 'type', 'status', 'city', 'district', 'neighborhood',
            'address', 'latitude', 'longitude', 'grossArea', 'netArea',
            'roomType', 'floorNumber', 'totalFloors', 'buildYear',
            'hasElevator', 'hasParking', 'heatingType', 'purchasePrice',
            'purchaseDate', 'currentValue', 'monthlyRent', 'listingPrice',
            'parcelId', 'notes'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                if (['latitude', 'longitude', 'grossArea', 'netArea',
                    'purchasePrice', 'currentValue', 'monthlyRent', 'listingPrice'].includes(field)) {
                    updateData[field] = body[field] ? parseFloat(body[field]) : null;
                } else if (['floorNumber', 'totalFloors', 'buildYear', 'parcelId'].includes(field)) {
                    updateData[field] = body[field] ? parseInt(body[field]) : null;
                } else if (field === 'purchaseDate') {
                    updateData[field] = body[field] ? new Date(body[field]) : null;
                } else {
                    updateData[field] = body[field];
                }
            }
        }

        const updated = await prisma.property.update({
            where: { id: propertyId },
            data: updateData,
            include: {
                images: true,
                parcel: true,
            }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("PATCH /api/properties/[id] Error:", error);
        return NextResponse.json(
            { error: "Gayrimenkul güncellenemedi" },
            { status: 500 }
        );
    }
}

// DELETE /api/properties/[id] - Gayrimenkul sil
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        const { id } = await params;
        const propertyId = parseInt(id);

        // Check ownership
        const existing = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { ownerId: true, title: true }
        });

        if (!existing) {
            return NextResponse.json(
                { error: "Gayrimenkul bulunamadı" },
                { status: 404 }
            );
        }

        if (!isAdmin((user as any).role) && existing.ownerId !== userId) {
            return NextResponse.json(
                { error: "Bu gayrimenkülü silme yetkiniz yok" },
                { status: 403 }
            );
        }

        await prisma.property.delete({
            where: { id: propertyId },
        });

        return NextResponse.json({
            success: true,
            message: `"${existing.title}" silindi`
        });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("DELETE /api/properties/[id] Error:", error);
        return NextResponse.json(
            { error: "Gayrimenkul silinemedi" },
            { status: 500 }
        );
    }
}
export const runtime = 'nodejs';
