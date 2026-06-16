import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, resolveUserId } from "@/lib/auth/roleCheck";

// PUT — Sahip onaylar veya reddeder (alan seçimiyle)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAuth();
        const userId = await resolveUserId(await requireAuth());
        const { id } = await params;

        const ar = await prisma.accessRequest.findUnique({ where: { id: Number(id) } });
        if (!ar) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
        if (ar.ownerId !== userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

        const body = await request.json();
        const {
            status,
            ownerNote,
            shareArea,
            shareZoning,
            sharePrice,
            shareCrmStage,
            shareNotes,
            shareContacts,
            shareOwnerInfo,
        } = body;

        if (!["APPROVED", "REJECTED"].includes(status)) {
            return NextResponse.json({ error: "Geçersiz durum" }, { status: 400 });
        }

        const updated = await prisma.accessRequest.update({
            where: { id: Number(id) },
            data: {
                status,
                ownerNote: ownerNote || null,
                ...(status === "APPROVED" && {
                    shareArea:      shareArea      ?? true,
                    shareZoning:    shareZoning    ?? true,
                    sharePrice:     sharePrice     ?? false,
                    shareCrmStage:  shareCrmStage  ?? false,
                    shareNotes:     shareNotes     ?? false,
                    shareContacts:  shareContacts  ?? false,
                    shareOwnerInfo: shareOwnerInfo ?? false,
                }),
            },
        });

        // Danışmana bildirim gönder
        const msgMap: Record<string, string> = {
            APPROVED: "Portföy erişim talebiniz onaylandı. Detayları görüntüleyebilirsiniz.",
            REJECTED: "Portföy erişim talebiniz reddedildi.",
        };
        await prisma.notification.create({
            data: {
                type: "ACCESS_REQUEST_RESULT",
                title: status === "APPROVED" ? "Erişim Talebi Onaylandı" : "Erişim Talebi Reddedildi",
                message: msgMap[status],
                relatedId: updated.id,
                relatedType: "ACCESS_REQUEST",
                userId: ar.requesterId,
            },
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Talep güncellenemedi" }, { status: 500 });
    }
}

// DELETE — Danışman talebini geri çeker
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAuth();
        const userId = await resolveUserId(await requireAuth());
        const { id } = await params;

        const ar = await prisma.accessRequest.findUnique({ where: { id: Number(id) } });
        if (!ar) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
        if (ar.requesterId !== userId) return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

        await prisma.accessRequest.delete({ where: { id: Number(id) } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Talep silinemedi" }, { status: 500 });
    }
}
