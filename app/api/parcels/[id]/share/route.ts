import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/roleCheck";

// GET: list who this parcel is shared with
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const { id } = await params;
        const parcelId = parseInt(id);

        const shares = await prisma.parcelShare.findMany({
            where: { parcelId },
            include: { user: { select: { id: true, name: true, email: true, role: true } } },
        });
        return NextResponse.json(shares);
    } catch (error: any) {
        if (error.message === "Unauthorized" || error.message === "Admin access required")
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// POST: share parcel with a user (or update permission)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireAdmin();
        const { id } = await params;
        const parcelId = parseInt(id);
        const { userId, permission = "VIEW" } = await request.json();

        if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

        const share = await prisma.parcelShare.upsert({
            where: { parcelId_userId: { parcelId, userId } },
            update: { permission },
            create: { parcelId, userId, permission, sharedById: parseInt(admin.id || "0") },
        });

        // Bildirim gönder
        await prisma.notification.create({
            data: {
                type: "PARCEL_SHARED",
                title: "Yeni Parsel Paylaşımı",
                message: `Bir parsel sizinle paylaşıldı.`,
                relatedId: parcelId,
                relatedType: "PARCEL",
                userId,
            },
        });

        return NextResponse.json(share, { status: 201 });
    } catch (error: any) {
        if (error.message === "Unauthorized" || error.message === "Admin access required")
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

// DELETE: revoke share
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdmin();
        const { id } = await params;
        const parcelId = parseInt(id);
        const { searchParams } = new URL(request.url);
        const userId = parseInt(searchParams.get("userId") || "");

        if (isNaN(userId)) return NextResponse.json({ error: "userId required" }, { status: 400 });

        await prisma.parcelShare.deleteMany({ where: { parcelId, userId } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "Unauthorized" || error.message === "Admin access required")
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
