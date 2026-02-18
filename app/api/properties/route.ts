import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";
import { rateLimit, getRateLimitHeaders } from "@/lib/rateLimit";

// GET /api/properties - Tüm gayrimenkulleri listele
export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");
        const status = searchParams.get("status");
        const city = searchParams.get("city");
        const district = searchParams.get("district");
        const roomType = searchParams.get("roomType");

        // Build query based on role
        const where: any = isAdmin((user as any).role as string)
            ? {} // Admin sees all
            : { ownerId: userId };

        if (type) where.type = type;
        if (status) where.status = status;
        if (city) where.city = city;
        if (district) where.district = district;
        if (roomType) where.roomType = roomType;

        const properties = await prisma.property.findMany({
            where,
            orderBy: { createdAt: "desc" },
            include: {
                images: true,
                parcel: {
                    select: {
                        id: true,
                        island: true,
                        parsel: true,
                        neighborhood: true,
                    }
                },
                _count: {
                    select: { units: true, transactions: true }
                }
            },
        });
        return NextResponse.json(properties);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("GET /api/properties Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch properties" },
            { status: 500 }
        );
    }
}

// POST /api/properties - Yeni gayrimenkul ekle
export async function POST(request: Request) {
    // Rate limiting
    const rateLimitResult = rateLimit(request, "/api/properties");

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
        const userId = await getUserId();
        const body = await request.json();

        const {
            title,
            type,
            status,
            city,
            district,
            neighborhood,
            address,
            latitude,
            longitude,
            grossArea,
            netArea,
            roomType,
            floorNumber,
            totalFloors,
            buildYear,
            hasElevator,
            hasParking,
            heatingType,
            purchasePrice,
            purchaseDate,
            currentValue,
            monthlyRent,
            listingPrice,
            parcelId,
            notes,
        } = body;

        // Validate required fields
        if (!title || !city || !district || !neighborhood) {
            return NextResponse.json(
                { error: "Başlık, şehir, ilçe ve mahalle zorunludur." },
                { status: 400 }
            );
        }

        const newProperty = await prisma.property.create({
            data: {
                title,
                type: type || "APARTMENT",
                status: status || "AVAILABLE",
                city,
                district,
                neighborhood,
                address,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                grossArea: grossArea ? parseFloat(grossArea) : null,
                netArea: netArea ? parseFloat(netArea) : null,
                roomType,
                floorNumber: floorNumber ? parseInt(floorNumber) : null,
                totalFloors: totalFloors ? parseInt(totalFloors) : null,
                buildYear: buildYear ? parseInt(buildYear) : null,
                hasElevator: hasElevator || false,
                hasParking: hasParking || false,
                heatingType,
                purchasePrice: purchasePrice ? parseFloat(purchasePrice) : null,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
                currentValue: currentValue ? parseFloat(currentValue) : null,
                monthlyRent: monthlyRent ? parseFloat(monthlyRent) : null,
                listingPrice: listingPrice ? parseFloat(listingPrice) : null,
                parcelId: parcelId ? parseInt(parcelId) : null,
                notes,
                ownerId: userId,
            },
            include: {
                images: true,
                parcel: true,
            }
        });

        return NextResponse.json(newProperty, { status: 201 });
    } catch (error: any) {
        console.error("POST /api/properties Error:", error);
        return NextResponse.json(
            { error: "Gayrimenkul oluşturulamadı", details: error.message },
            { status: 500 }
        );
    }
}
export const runtime = 'nodejs';
