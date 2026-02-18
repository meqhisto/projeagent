import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q")?.trim();

        if (!query || query.length < 2) {
            return NextResponse.json({ parcels: [], customers: [] });
        }

        // Search parcels
        const parcels = await prisma.parcel.findMany({
            where: {
                OR: [
                    { city: { contains: query, mode: "insensitive" } },
                    { district: { contains: query, mode: "insensitive" } },
                    { neighborhood: { contains: query, mode: "insensitive" } },
                    { island: { contains: query, mode: "insensitive" } },
                    { parsel: { contains: query, mode: "insensitive" } },
                    { tags: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                city: true,
                district: true,
                neighborhood: true,
                island: true,
                parsel: true,
                area: true,
                category: true,
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        });

        // Search customers
        const customers = await prisma.customer.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { email: { contains: query, mode: "insensitive" } },
                    { phone: { contains: query, mode: "insensitive" } },
                    { role: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                role: true,
            },
            take: 5,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ parcels, customers });
    } catch (error) {
        console.error("Search error:", error);
        return NextResponse.json({ error: "Arama yapılırken hata oluştu" }, { status: 500 });
    }
}
export const runtime = 'nodejs';
