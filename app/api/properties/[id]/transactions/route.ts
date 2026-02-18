import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

// GET - Property'ye ait tüm işlemleri listele
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
                { error: "Erişim yetkiniz yok" },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where: any = { propertyId };
        if (type) where.type = type;
        if (startDate) where.date = { ...where.date, gte: new Date(startDate) };
        if (endDate) where.date = { ...where.date, lte: new Date(endDate) };

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                unit: {
                    select: {
                        id: true,
                        unitNumber: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(transactions);

    } catch (error: any) {
        if (error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
        }
        console.error("GET transactions error:", error);
        return NextResponse.json(
            { error: "İşlemler yüklenemedi" },
            { status: 500 }
        );
    }
}

// POST - Yeni işlem ekle
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
                { error: "Erişim yetkiniz yok" },
                { status: 403 }
            );
        }

        const body = await request.json();
        const {
            type,
            amount,
            date,
            description,
            category,
            unitId,
            isPaid,
            dueDate
        } = body;

        if (!type || !amount || !date) {
            return NextResponse.json(
                { error: "İşlem tipi, tutar ve tarih zorunludur" },
                { status: 400 }
            );
        }

        const newTransaction = await prisma.transaction.create({
            data: {
                propertyId,
                unitId: unitId ? parseInt(unitId) : null,
                type,
                amount: parseFloat(amount),
                date: new Date(date),
                description: description || null,
                category: category || null,
                isPaid: isPaid ?? true,
                dueDate: dueDate ? new Date(dueDate) : null
            },
            include: {
                unit: {
                    select: {
                        id: true,
                        unitNumber: true
                    }
                }
            }
        });

        return NextResponse.json(newTransaction, { status: 201 });

    } catch (error: any) {
        if (error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
        }
        console.error("POST transaction error:", error);
        return NextResponse.json(
            { error: "İşlem eklenemedi" },
            { status: 500 }
        );
    }
}
export const runtime = 'nodejs';
