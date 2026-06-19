import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = "nodejs";

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string; docId: string }> }
) {
    try {
        const user = await requireAuth();
        const userId = await getUserId();
        const { id, docId } = await params;
        const propertyId = parseInt(id);
        const documentId = parseInt(docId);

        const doc = await prisma.propertyDocument.findUnique({
            where: { id: documentId },
            include: { property: { select: { ownerId: true } } },
        });
        if (!doc || doc.propertyId !== propertyId) {
            return NextResponse.json({ error: "Belge bulunamadı" }, { status: 404 });
        }
        if (!isAdmin((user as any).role) && doc.property.ownerId !== userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        await prisma.propertyDocument.delete({ where: { id: documentId } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Belge silinemedi" }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string; docId: string }> }
) {
    try {
        const user = await requireAuth();
        const userId = await getUserId();
        const { id, docId } = await params;
        const propertyId = parseInt(id);
        const documentId = parseInt(docId);

        const doc = await prisma.propertyDocument.findUnique({
            where: { id: documentId },
            include: { property: { select: { ownerId: true } } },
        });
        if (!doc || doc.propertyId !== propertyId) {
            return NextResponse.json({ error: "Belge bulunamadı" }, { status: 404 });
        }
        if (!isAdmin((user as any).role) && doc.property.ownerId !== userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const body = await request.json();
        const updated = await prisma.propertyDocument.update({
            where: { id: documentId },
            data: {
                ...(body.docType && { docType: body.docType }),
                ...(body.name && { name: body.name }),
                url: body.url ?? doc.url,
                expiryDate: body.expiryDate ? new Date(body.expiryDate) : doc.expiryDate,
                notes: body.notes ?? doc.notes,
            },
        });
        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Belge güncellenemedi" }, { status: 500 });
    }
}
