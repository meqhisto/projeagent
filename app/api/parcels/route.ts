import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";
import { rateLimit, getRateLimitHeaders } from "@/lib/rateLimit";
import { ParcelCreateSchema, validateSchema } from "@/lib/validations";

export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const { searchParams } = new URL(request.url);
        const island = searchParams.get("island");
        const parsel = searchParams.get("parsel");
        const category = searchParams.get("category");

        // Build query based on role
        const where: Prisma.ParcelWhereInput = isAdmin(user.role as string)
            ? {} // Admin sees all
            : {
                OR: [
                    { ownerId: userId },
                    { assignedTo: userId }
                ]
            };

        if (island) {
            where.island = island;
        }

        if (parsel) {
            where.parsel = parsel;
        }

        if (category) {
            where.category = category as any; // Cast to any to bypass strict enum check for now, or import ParcelCategory
        }

        const parcels = await prisma.parcel.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                images: true,
                zoning: true,
            },
        });
        return NextResponse.json(parcels);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json(
            { error: "Failed to fetch parcels" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    // Rate limiting for POST operations
    const rateLimitResult = rateLimit(request, "/api/parcels");

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: "Çok fazla istek. Lütfen biraz bekleyin." },
            {
                status: 429,
                headers: getRateLimitHeaders(rateLimitResult),
            }
        );
    }

    try {
        console.log("POST /api/parcels - Starting");
        const userId = await getUserId();
        console.log("POST /api/parcels - User ID:", userId);

        const body = await request.json();
        console.log("POST /api/parcels - Body received", { city: body.city, parsel: body.parsel });

        // Zod validation
        const validation = validateSchema(ParcelCreateSchema, body);

        if (!validation.success) {
            console.log("POST /api/parcels - Validation errors:", validation.errors);
            return NextResponse.json(
                { error: "Geçersiz veri", details: validation.errors },
                { status: 400 }
            );
        }

        const { city, district, neighborhood, island, parsel, area, latitude, longitude, category, tags } = validation.data!;

        const newParcel = await prisma.parcel.create({
            data: {
                city,
                district,
                neighborhood,
                island,
                parsel,
                area: area,
                latitude: latitude,
                longitude: longitude,
                status: "RESEARCHING",
                category: category || "UNCATEGORIZED",
                tags: tags || null,
                ownerId: userId, // Automatically set owner
            },
        });
        console.log("POST /api/parcels - Created:", newParcel.id);

        // Trigger background research job
        // We don't await this to keep the API fast
        import("@/lib/jobs/process_parcel").then(({ processParcelInBackground }) => {
            processParcelInBackground(newParcel.id);
        });

        return NextResponse.json(newParcel, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json(
                { error: "Parcel already exists" },
                { status: 409 }
            );
        }
        console.error("POST Error:", error);
        return NextResponse.json(
            { error: "Failed to create parcel", details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
}
