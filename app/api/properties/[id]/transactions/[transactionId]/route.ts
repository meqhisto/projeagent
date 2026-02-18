import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

// GET - Tek bir işlem detayı
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
    try {
        const { id, transactionId } = await params;
        const propertyId = parseInt(id);
        const txId = parseInt(transactionId);

        if (isNaN(propertyId) || isNaN(txId)) {
            return NextResponse.json(
                { error: "Geçersiz ID" },
                { status: 400 }
            );
        }

        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const transaction = await prisma.transaction.findFirst({
            where: {
                id: txId,
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
                unit: {
                    select: {
                        id: true,
                        unitNumber: true
                    }
                }
            }
        });

        if (!transaction) {
            return NextResponse.json(
                { error: "İşlem bulunamadı" },
                { status: 404 }
            );
        }

        if (transaction.property?.ownerId !== userId && !isAdmin((user as any).role)) {
            return NextResponse.json(
                { error: "Erişim yetkiniz yok" },
                { status: 403 }
            );
        }

        return NextResponse.json(transaction);

    } catch (error: any) {
        if (error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
        }
        console.error("GET transaction error:", error);
        return NextResponse.json(
            { error: "İşlem yüklenemedi" },
            { status: 500 }
        );
    }
}

// PATCH - İşlem güncelle
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
    try {
        const { id, transactionId } = await params;
        const propertyId = parseInt(id);
        const txId = parseInt(transactionId);

        if (isNaN(propertyId) || isNaN(txId)) {
            return NextResponse.json(
                { error: "Geçersiz ID" },
                { status: 400 }
            );
        }

        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const existing = await prisma.transaction.findFirst({
            where: {
                id: txId,
                propertyId
            },
            include: {
                property: {
                    select: { ownerId: true }
                }
            }
        });

        if (!existing) {
            return NextResponse.json(
                { error: "İşlem bulunamadı" },
                { status: 404 }
            );
        }

        if (existing.property?.ownerId !== userId && !isAdmin((user as any).role)) {
            return NextResponse.json(
                { error: "Düzenleme yetkiniz yok" },
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

        const updated = await prisma.transaction.update({
            where: { id: txId },
            data: {
                type: type !== undefined ? type : undefined,
                amount: amount !== undefined ? parseFloat(amount) : undefined,
                date: date !== undefined ? new Date(date) : undefined,
                description: description !== undefined ? (description || null) : undefined,
                category: category !== undefined ? (category || null) : undefined,
                unitId: unitId !== undefined ? (unitId ? parseInt(unitId) : null) : undefined,
                isPaid: isPaid !== undefined ? isPaid : undefined,
                dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined
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

        return NextResponse.json(updated);

    } catch (error: any) {
        if (error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
        }
        console.error("PATCH transaction error:", error);
        return NextResponse.json(
            { error: "İşlem güncellenemedi" },
            { status: 500 }
        );
    }
}

// DELETE - İşlem sil
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
    try {
        const { id, transactionId } = await params;
        const propertyId = parseInt(id);
        const txId = parseInt(transactionId);

        if (isNaN(propertyId) || isNaN(txId)) {
            return NextResponse.json(
                { error: "Geçersiz ID" },
                { status: 400 }
            );
        }

        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const existing = await prisma.transaction.findFirst({
            where: {
                id: txId,
                propertyId
            },
            include: {
                property: {
                    select: { ownerId: true }
                }
            }
        });

        if (!existing) {
            return NextResponse.json(
                { error: "İşlem bulunamadı" },
                { status: 404 }
            );
        }

        if (existing.property?.ownerId !== userId && !isAdmin((user as any).role)) {
            return NextResponse.json(
                { error: "Silme yetkiniz yok" },
                { status: 403 }
            );
        }

        await prisma.transaction.delete({
            where: { id: txId }
        });

        return NextResponse.json({
            success: true,
            message: "İşlem silindi"
        });

    } catch (error: any) {
        if (error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
        }
        console.error("DELETE transaction error:", error);
        return NextResponse.json(
            { error: "İşlem silinemedi" },
            { status: 500 }
        );
    }
}
export const runtime = 'nodejs';
