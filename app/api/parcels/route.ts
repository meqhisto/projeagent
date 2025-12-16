import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";

export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const { searchParams } = new URL(request.url);

        // Build query based on role
        const where = isAdmin((user as any).role as string)
            ? {} // Admin sees all
            : {
                OR: [
                    { ownerId: userId },
                    { assignedTo: userId }
                ]
            };

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
    try {
        console.log("POST /api/parcels - Starting");
        const userId = await getUserId();
        console.log("POST /api/parcels - User ID:", userId);

        const body = await request.json();
        console.log("POST /api/parcels - Body received", { city: body.city, parsel: body.parsel });

        const { city, district, neighborhood, island, parsel, area, latitude, longitude } = body;

        // Basic validation
        const missingFields = [];
        if (!city) missingFields.push("city (İl)");
        if (!district) missingFields.push("district (İlçe)");
        if (!neighborhood) missingFields.push("neighborhood (Mahalle)");
        if (!island) missingFields.push("island (Ada)");
        if (!parsel) missingFields.push("parsel (Parsel)");

        if (missingFields.length > 0) {
            console.log("POST /api/parcels - Missing fields:", missingFields);
            return NextResponse.json(
                { error: `Eksik alanlar: ${missingFields.join(", ")}` },
                { status: 400 }
            );
        }

        const newParcel = await prisma.parcel.create({
            data: {
                city,
                district,
                neighborhood,
                island,
                parsel,
                area: area ? parseFloat(area) : null,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                status: "RESEARCHING",
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
