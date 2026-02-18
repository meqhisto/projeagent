import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

// GET - Property'ye ait tüm birimleri listele
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const propertyId = parseInt(id);

        if (isNaN(propertyId)) {
            return NextResponse.json(
                { error: "Geçersiz property ID" },
                { status: 400 }
            );
        }

        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        // Property'nin varlığını ve sahipliğini kontrol et
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { ownerId: true }
        });

        if (!property) {
            return NextResponse.json(
                { error: "Gayrimenkul bulunamadı" },
                { status: 404 }
            );
        }

        // Sadece sahibi veya admin erişebilir
        if (property.ownerId !== userId && !isAdmin((user as any).role)) {
            return NextResponse.json(
                { error: "Bu gayrimenkule erişim yetkiniz yok" },
                { status: 403 }
            );
        }

        const units = await prisma.unit.findMany({
            where: { propertyId },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true
                    }
                }
            },
            orderBy: { unitNumber: 'asc' }
        });

        return NextResponse.json(units);

    } catch (error: any) {
        if (error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
        }
        console.error("GET units error:", error);
        return NextResponse.json(
            { error: "Birimler yüklenemedi" },
            { status: 500 }
        );
    }
}

// POST - Yeni birim ekle
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const propertyId = parseInt(id);

        if (isNaN(propertyId)) {
            return NextResponse.json(
                { error: "Geçersiz property ID" },
                { status: 400 }
            );
        }

        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        // Property'nin varlığını ve sahipliğini kontrol et
        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { ownerId: true }
        });

        if (!property) {
            return NextResponse.json(
                { error: "Gayrimenkul bulunamadı" },
                { status: 404 }
            );
        }

        if (property.ownerId !== userId && !isAdmin((user as any).role)) {
            return NextResponse.json(
                { error: "Bu gayrimenkule erişim yetkiniz yok" },
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

        if (!unitNumber) {
            return NextResponse.json(
                { error: "Birim numarası zorunludur" },
                { status: 400 }
            );
        }

        // Aynı property'de aynı birim numarası var mı kontrol et
        const existingUnit = await prisma.unit.findFirst({
            where: {
                propertyId,
                unitNumber
            }
        });

        if (existingUnit) {
            return NextResponse.json(
                { error: "Bu birim numarası zaten kullanımda" },
                { status: 400 }
            );
        }

        const newUnit = await prisma.unit.create({
            data: {
                propertyId,
                unitNumber,
                roomType: roomType || null,
                area: area ? parseFloat(area) : null,
                status: status || "AVAILABLE",
                floorNumber: floorNumber ? parseInt(floorNumber) : null,
                monthlyRent: monthlyRent ? parseFloat(monthlyRent) : null,
                currentValue: currentValue ? parseFloat(currentValue) : null,
                tenantId: tenantId ? parseInt(tenantId) : null,
                leaseStart: leaseStart ? new Date(leaseStart) : null,
                leaseEnd: leaseEnd ? new Date(leaseEnd) : null,
                notes: notes || null
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

        return NextResponse.json(newUnit, { status: 201 });

    } catch (error: any) {
        if (error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
        }
        console.error("POST unit error:", error);
        return NextResponse.json(
            { error: "Birim eklenemedi" },
            { status: 500 }
        );
    }
}
export const runtime = 'nodejs';
