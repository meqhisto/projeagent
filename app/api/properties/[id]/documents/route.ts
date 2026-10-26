import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = "nodejs";

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const propertyId = parseInt(id);

        const docs = await prisma.propertyDocument.findMany({
            where: { propertyId },
            orderBy: { createdAt: "desc" },
        });
        return NextResponse.json(docs);
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Belgeler alınamadı" }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await requireAuth();
        const userId = await getUserId();
        const { id } = await params;
        const propertyId = parseInt(id);

        const property = await prisma.property.findUnique({
            where: { id: propertyId },
            select: { ownerId: true },
        });
        if (!property) return NextResponse.json({ error: "Gayrimenkul bulunamadı" }, { status: 404 });
        if (!isAdmin((user as any).role) && property.ownerId !== userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const body = await request.json();
        const { docType, name, url, expiryDate, notes } = body;

        if (!name) return NextResponse.json({ error: "Belge adı zorunludur" }, { status: 400 });

        const doc = await prisma.propertyDocument.create({
            data: {
                propertyId,
                docType: docType || "OTHER",
                name,
                url: url || null,
                expiryDate: expiryDate ? new Date(expiryDate) : null,
                notes: notes || null,
            },
        });
        return NextResponse.json(doc, { status: 201 });
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Belge eklenemedi" }, { status: 500 });
    }
}
