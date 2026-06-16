import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";
import { DemandUpdateSchema, validateSchema } from "@/lib/validations";
import { logCrudAction } from "@/lib/auditLog";

async function getDemandOrForbid(id: number, userId: number, role: string) {
    const demand = await prisma.demandRequest.findUnique({ where: { id } });
    if (!demand) return null;
    if (!isAdmin(role) && demand.createdById !== userId) return "forbidden";
    return demand;
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireAuth();
        const userId = await getUserId();
        const { id } = await params;

        const demand = await prisma.demandRequest.findUnique({
            where: { id: Number(id) },
            include: {
                customer: { select: { id: true, name: true, phone: true, email: true } },
                createdBy: { select: { id: true, name: true } },
                matches: {
                    orderBy: { score: "desc" },
                    include: {
                        parcel: { select: { id: true, city: true, district: true, neighborhood: true, island: true, parsel: true, area: true, askingPrice: true, category: true, zoning: true } },
                        property: { select: { id: true, title: true, type: true, city: true, district: true, neighborhood: true, netArea: true, grossArea: true, listingPrice: true, currentValue: true, roomType: true } },
                    },
                },
            },
        });

        if (!demand) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
        if (!isAdmin(user.role as string) && demand.createdById !== userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        return NextResponse.json(demand);
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Talep alınamadı" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireAuth();
        const userId = await getUserId();
        const { id } = await params;

        const result = await getDemandOrForbid(Number(id), userId, user.role as string);
        if (!result) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
        if (result === "forbidden") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

        const body = await request.json();
        const validation = validateSchema(DemandUpdateSchema, body);
        if (!validation.success) {
            return NextResponse.json({ error: "Geçersiz veri", details: validation.errors }, { status: 400 });
        }

        const data = validation.data!;
        const updated = await prisma.demandRequest.update({
            where: { id: Number(id) },
            data: {
                ...(data.title !== undefined && { title: data.title }),
                ...(data.type !== undefined && { type: data.type as any }),
                ...(data.status !== undefined && { status: data.status as any }),
                ...(data.customerId !== undefined && { customerId: data.customerId }),
                ...(data.city !== undefined && { city: data.city }),
                ...(data.district !== undefined && { district: data.district }),
                ...(data.neighborhood !== undefined && { neighborhood: data.neighborhood }),
                ...(data.minPrice !== undefined && { minPrice: data.minPrice }),
                ...(data.maxPrice !== undefined && { maxPrice: data.maxPrice }),
                ...(data.minArea !== undefined && { minArea: data.minArea }),
                ...(data.maxArea !== undefined && { maxArea: data.maxArea }),
                ...(data.parcelCategory !== undefined && { parcelCategory: data.parcelCategory }),
                ...(data.minKAKS !== undefined && { minKAKS: data.minKAKS }),
                ...(data.maxKAKS !== undefined && { maxKAKS: data.maxKAKS }),
                ...(data.zoningType !== undefined && { zoningType: data.zoningType }),
                ...(data.propertyType !== undefined && { propertyType: data.propertyType }),
                ...(data.roomType !== undefined && { roomType: data.roomType }),
                ...(data.hasElevator !== undefined && { hasElevator: data.hasElevator }),
                ...(data.hasParking !== undefined && { hasParking: data.hasParking }),
                ...(data.notes !== undefined && { notes: data.notes }),
                ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
            },
        });

        await logCrudAction(request, userId, "UPDATE", "demands", updated.id);
        return NextResponse.json(updated);
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Talep güncellenemedi" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireAuth();
        const userId = await getUserId();
        const { id } = await params;

        const result = await getDemandOrForbid(Number(id), userId, user.role as string);
        if (!result) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
        if (result === "forbidden") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

        await prisma.demandRequest.delete({ where: { id: Number(id) } });
        await logCrudAction(request, userId, "DELETE", "demands", Number(id));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Talep silinemedi" }, { status: 500 });
    }
}
