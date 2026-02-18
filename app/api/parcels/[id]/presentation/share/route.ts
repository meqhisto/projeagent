import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

// POST - Yeni paylaşım linki oluştur
export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const parcelId = parseInt(params.id);
        if (isNaN(parcelId)) {
            return NextResponse.json({ error: "Invalid parcel ID" }, { status: 400 });
        }

        // Parsel yetki kontrolü
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
        const { title, expiresAt } = body;

        // Yeni paylaşım linki oluştur
        const share = await prisma.presentationShare.create({
            data: {
                parcelId,
                createdById: userId,
                title,
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        // Public URL oluştur
        const shareUrl = `${process.env.NEXTAUTH_URL || 'https://ekip.invecoproje.com'}/p/${share.token}`;

        return NextResponse.json({
            ...share,
            shareUrl
        }, { status: 201 });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("POST presentation share error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// GET - Parsel için mevcut paylaşım linklerini getir
export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const parcelId = parseInt(params.id);
        if (isNaN(parcelId)) {
            return NextResponse.json({ error: "Invalid parcel ID" }, { status: 400 });
        }

        // Parsel yetki kontrolü
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

        const shares = await prisma.presentationShare.findMany({
            where: { parcelId },
            orderBy: { createdAt: 'desc' }
        });

        // Public URL'leri ekle
        const baseUrl = process.env.NEXTAUTH_URL || 'https://ekip.invecoproje.com';
        const sharesWithUrls = shares.map(share => ({
            ...share,
            shareUrl: `${baseUrl}/p/${share.token}`
        }));

        return NextResponse.json(sharesWithUrls);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("GET presentation shares error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// DELETE - Paylaşım linkini sil veya deaktive et
export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const { searchParams } = new URL(request.url);
        const shareId = searchParams.get("shareId");

        if (!shareId) {
            return NextResponse.json({ error: "Missing shareId" }, { status: 400 });
        }

        const parcelId = parseInt(params.id);

        // Parsel yetki kontrolü
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

        // Linki deaktive et
        await prisma.presentationShare.update({
            where: { id: parseInt(shareId) },
            data: { isActive: false }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("DELETE presentation share error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
export const runtime = 'nodejs';
