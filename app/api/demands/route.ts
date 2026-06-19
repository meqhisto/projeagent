import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = "nodejs";
import { rateLimit, getRateLimitHeaders } from "@/lib/rateLimit";
import { DemandCreateSchema, validateSchema } from "@/lib/validations";
import { logCrudAction } from "@/lib/auditLog";

export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const userId = await getUserId();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const type = searchParams.get("type");

        const where: Record<string, unknown> = isAdmin(user.role as string)
            ? {}
            : { createdById: userId };

        if (status) where.status = status;
        if (type) where.type = type;

        const demands = await prisma.demandRequest.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                customer: { select: { id: true, name: true, phone: true, email: true } },
                createdBy: { select: { id: true, name: true } },
                _count: { select: { matches: true } },
            },
        });

        return NextResponse.json(demands);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: "Talepler alınamadı" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const rateLimitResult = rateLimit(request, "/api/demands");
    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: "Çok fazla istek. Lütfen biraz bekleyin." },
            { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
        );
    }

    try {
        const user = await requireAuth();
        const userId = await getUserId();

        const body = await request.json();
        const validation = validateSchema(DemandCreateSchema, body);
        if (!validation.success) {
            return NextResponse.json({ error: "Geçersiz veri", details: validation.errors }, { status: 400 });
        }

        const data = validation.data!;
        const demand = await prisma.demandRequest.create({
            data: {
                title: data.title,
                type: (data.type as any) ?? "BOTH",
                createdById: userId,
                customerId: data.customerId ?? null,
                city: data.city ?? null,
                district: data.district ?? null,
                neighborhood: data.neighborhood ?? null,
                minPrice: data.minPrice ?? null,
                maxPrice: data.maxPrice ?? null,
                minArea: data.minArea ?? null,
                maxArea: data.maxArea ?? null,
                parcelCategory: data.parcelCategory ?? null,
                minKAKS: data.minKAKS ?? null,
                maxKAKS: data.maxKAKS ?? null,
                zoningType: data.zoningType ?? null,
                propertyType: data.propertyType ?? null,
                roomType: data.roomType ?? null,
                hasElevator: data.hasElevator ?? null,
                hasParking: data.hasParking ?? null,
                notes: data.notes ?? null,
                deadline: data.deadline ? new Date(data.deadline) : null,
            },
        });

        await logCrudAction(request, userId, "CREATE", "demands", demand.id);

        // Arka planda eşleştir
        import("@/lib/demands/matchDemand").then(({ runMatchForDemand }) => {
            runMatchForDemand(demand.id).catch(() => null);
        });

        return NextResponse.json(demand, { status: 201 });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ error: "Talep oluşturulamadı" }, { status: 500 });
    }
}
