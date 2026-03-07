import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

// GET - Tek bir birim detayı
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; unitId: string }> }
) {
    try {
        const { id, unitId } = await params;
        const propertyId = parseInt(id);
        const unitIdNum = parseInt(unitId);

        if (isNaN(propertyId) || isNaN(unitIdNum)) {
            return NextResponse.json(
                { error: "Geçersiz ID" },
                { status: 400 }
            );
        }

        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const unit = await prisma.unit.findFirst({
            where: {
                id: unitIdNum,
                propertyId
            },
            include: {
                property: {
                    select: {
                        id: true,
                        title: true,
                        ownerId: true
                    }
                },
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                },
                transactions: {
                    orderBy: { date: 'desc' },
                    take: 10
                }
            }
        });

        if (!unit) {
            return NextResponse.json(
                { error: "Birim bulunamadı" },
                { status: 404 }
            );
        }

        if (unit.property.ownerId !== userId && !isAdmin((user as any).role)) {
            return NextResponse.json(
                { error: "Erişim yetkiniz yok" },
                { status: 403 }
            );
        }

        return NextResponse.json(unit);

    } catch (error: any) {
        if (error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
        }
        console.error("GET unit error:", error);
        return NextResponse.json(
            { error: "Birim yüklenemedi" },
            { status: 500 }
        );
    }
}

// PATCH - Birim güncelle
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; unitId: string }> }
) {
    try {
        const { id, unitId } = await params;
        const propertyId = parseInt(id);
        const unitIdNum = parseInt(unitId);

        if (isNaN(propertyId) || isNaN(unitIdNum)) {
            return NextResponse.json(
                { error: "Geçersiz ID" },
                { status: 400 }
            );
        }

        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const existingUnit = await prisma.unit.findFirst({
            where: {
                id: unitIdNum,
                propertyId
            },
            include: {
                property: {
                    select: { ownerId: true }
                }
            }
        });

        if (!existingUnit) {
            return NextResponse.json(
                { error: "Birim bulunamadı" },
                { status: 404 }
            );
        }

        if (existingUnit.property.ownerId !== userId && !isAdmin((user as any).role)) {
            return NextResponse.json(
                { error: "Düzenleme yetkiniz yok" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            unitNumber,
            roomType,
            area,
            status,
            floorNumber,
            monthlyRent,
            currentValue,
            tenantId,
            leaseStart,
            leaseEnd,
            notes
        } = body;

        // Eğer unitNumber değişiyorsa, çakışma kontrolü yap
        if (unitNumber && unitNumber !== existingUnit.unitNumber) {
            const duplicate = await prisma.unit.findFirst({
                where: {
                    propertyId,
                    unitNumber,
                    NOT: { id: unitIdNum }
                }
            });

            if (duplicate) {
                return NextResponse.json(
                    { error: "Bu birim numarası zaten kullanımda" },
                    { status: 400 }
                );
            }
        }

        const updatedUnit = await prisma.unit.update({
            where: { id: unitIdNum },
            data: {
                unitNumber: unitNumber !== undefined ? unitNumber : undefined,
                roomType: roomType !== undefined ? (roomType || null) : undefined,
                area: area !== undefined ? (area ? parseFloat(area) : null) : undefined,
                status: status !== undefined ? status : undefined,
                floorNumber: floorNumber !== undefined ? (floorNumber ? parseInt(floorNumber) : null) : undefined,
                monthlyRent: monthlyRent !== undefined ? (monthlyRent ? parseFloat(monthlyRent) : null) : undefined,
                currentValue: currentValue !== undefined ? (currentValue ? parseFloat(currentValue) : null) : undefined,
                tenantId: tenantId !== undefined ? (tenantId ? parseInt(tenantId) : null) : undefined,
                leaseStart: leaseStart !== undefined ? (leaseStart ? new Date(leaseStart) : null) : undefined,
                leaseEnd: leaseEnd !== undefined ? (leaseEnd ? new Date(leaseEnd) : null) : undefined,
                notes: notes !== undefined ? (notes || null) : undefined
            },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            }
        });

        return NextResponse.json(updatedUnit);

    } catch (error: any) {
        if (error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
        }
        console.error("PATCH unit error:", error);
        return NextResponse.json(
            { error: "Birim güncellenemedi" },
            { status: 500 }
        );
    }
}

// DELETE - Birim sil
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; unitId: string }> }
) {
    try {
        const { id, unitId } = await params;
        const propertyId = parseInt(id);
        const unitIdNum = parseInt(unitId);

        if (isNaN(propertyId) || isNaN(unitIdNum)) {
            return NextResponse.json(
                { error: "Geçersiz ID" },
                { status: 400 }
            );
        }

        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const existingUnit = await prisma.unit.findFirst({
            where: {
                id: unitIdNum,
                propertyId
            },
            include: {
                property: {
                    select: { ownerId: true }
                }
            }
        });

        if (!existingUnit) {
            return NextResponse.json(
                { error: "Birim bulunamadı" },
                { status: 404 }
            );
        }

        if (existingUnit.property.ownerId !== userId && !isAdmin((user as any).role)) {
            return NextResponse.json(
                { error: "Silme yetkiniz yok" },
                { status: 403 }
            );
        }

        await prisma.unit.delete({
            where: { id: unitIdNum }
        });

        return NextResponse.json({
            success: true,
            message: `"${existingUnit.unitNumber}" birimi silindi`
        });

    } catch (error: any) {
        if (error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
        }
        console.error("DELETE unit error:", error);
        return NextResponse.json(
            { error: "Birim silinemedi" },
            { status: 500 }
        );
    }
}
export const runtime = 'nodejs';
