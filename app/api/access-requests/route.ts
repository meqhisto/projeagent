import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, resolveUserId, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = "nodejs";
import { rateLimit, getRateLimitHeaders } from "@/lib/rateLimit";

// GET — Danışman: gönderilen talepler | Sahip: alınan talepler
export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const userId = await resolveUserId(user);

        const { searchParams } = new URL(request.url);
        const role = searchParams.get("role"); // "requester" | "owner"
        const status = searchParams.get("status");

        const where: Record<string, unknown> = {};
        if (role === "owner") {
            where.ownerId = userId;
        } else {
            // varsayılan: danışman kendi gönderdiği talepleri görür
            where.requesterId = userId;
        }
        if (status) where.status = status;

        const requests = await prisma.accessRequest.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                requester: { select: { id: true, name: true, email: true } },
                owner:     { select: { id: true, name: true } },
                parcel: {
                    select: {
                        id: true, city: true, district: true, neighborhood: true,
                        island: true, parsel: true, area: true, category: true,
                    }
                },
                property: {
                    select: {
                        id: true, title: true, type: true,
                        city: true, district: true, neighborhood: true,
                    }
                },
                demandMatch: { select: { id: true, score: true } },
            },
        });

        return NextResponse.json(requests);
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Talepler alınamadı" }, { status: 500 });
    }
}

// POST — Danışman erişim talebi oluşturur
export async function POST(request: Request) {
    const rateLimitResult = rateLimit(request, "/api/access-requests");
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: "Çok fazla istek." },
            { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
        );
    }

    try {
        await requireAuth();
        const requesterId = await getUserId();

        const body = await request.json();
        const { parcelId, propertyId, demandMatchId, message } = body;

        if (!parcelId && !propertyId) {
            return NextResponse.json({ error: "parcelId veya propertyId gerekli" }, { status: 400 });
        }

        // Portföy sahibini bul
        let ownerId: number | null = null;
        if (parcelId) {
            const p = await prisma.parcel.findUnique({ where: { id: Number(parcelId) }, select: { ownerId: true } });
            if (!p) return NextResponse.json({ error: "Parsel bulunamadı" }, { status: 404 });
            ownerId = p.ownerId;
        } else if (propertyId) {
            const p = await prisma.property.findUnique({ where: { id: Number(propertyId) }, select: { ownerId: true } });
            if (!p) return NextResponse.json({ error: "Gayrimenkul bulunamadı" }, { status: 404 });
            ownerId = p.ownerId;
        }

        if (ownerId === requesterId) {
            return NextResponse.json({ error: "Kendi portföyünüze erişim talebi gönderemezsiniz" }, { status: 400 });
        }

        // Daha önce talep gönderilmiş mi?
        const existing = await prisma.accessRequest.findFirst({
            where: {
                requesterId,
                ...(parcelId ? { parcelId: Number(parcelId) } : { propertyId: Number(propertyId) }),
            },
        });
        if (existing) {
            return NextResponse.json({ error: "Bu portföy için zaten erişim talebi gönderildi", existing }, { status: 409 });
        }

        const ar = await prisma.accessRequest.create({
            data: {
                requesterId,
                ownerId: ownerId!,
                parcelId: parcelId ? Number(parcelId) : null,
                propertyId: propertyId ? Number(propertyId) : null,
                demandMatchId: demandMatchId ? Number(demandMatchId) : null,
                message: message || null,
            },
        });

        // Sahibine bildirim gönder
        await prisma.notification.create({
            data: {
                type: "ACCESS_REQUEST",
                title: "Portföy Erişim Talebi",
                message: `Bir danışman portföyünüz için detay erişimi talep etti.`,
                relatedId: ar.id,
                relatedType: "ACCESS_REQUEST",
                userId: ownerId!,
            },
        });

        return NextResponse.json(ar, { status: 201 });
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Talep oluşturulamadı" }, { status: 500 });
    }
}
