import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";

// GET - Tüm firmaları listele
export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const userId = await getUserId();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const specialty = searchParams.get("specialty") || "";

        // Build where clause based on role
        const baseWhere: any = isAdmin((user as any).role as string)
            ? {} // Admin sees all contractors
            : { ownerId: userId }; // Users see only their own contractors

        if (search) {
            baseWhere.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { authorizedPerson: { contains: search, mode: "insensitive" } },
                { phone: { contains: search } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        if (specialty) {
            baseWhere.specialties = { contains: specialty, mode: "insensitive" };
        }

        // ⚡ Bolt Optimization: Replaced overfetching full ratings and matches arrays with _count.
        // Used groupBy to calculate average scores at the database level instead of in Node.js.
        // This avoids N+1 memory issues and drastically reduces the payload size.
        // Fetch the list of contractors first
        const contractors = await prisma.contractor.findMany({
            where: baseWhere,
            include: {
                _count: {
                    select: {
                        ratings: true,
                        matches: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const contractorIds = contractors.map(c => c.id);

        // Calculate averages via DB groupBy, scoped only to the retrieved contractors
        const ratingsAvg = contractorIds.length > 0
            ? await prisma.contractorRating.groupBy({
                by: ['contractorId'],
                where: { contractorId: { in: contractorIds } },
                _avg: {
                    reliability: true,
                    quality: true,
                    communication: true,
                    pricing: true,
                }
            })
            : [];

        const ratingsMap = new Map(
            ratingsAvg.map(r => {
                // Calculate average of the 4 score fields
                const { reliability, quality, communication, pricing } = r._avg;
                let avg = null;
                if (reliability !== null && quality !== null && communication !== null && pricing !== null) {
                    avg = (reliability + quality + communication + pricing) / 4;
                }
                return [r.contractorId, avg];
            })
        );

        // Her firma için ortalama puan ekle
        const contractorsWithAvg = contractors.map(c => ({
            ...c,
            averageScore: ratingsMap.get(c.id) ?? null
        }));

        return NextResponse.json(contractorsWithAvg);
    } catch (error) {
        console.error("Error fetching contractors:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Yeni firma oluştur
export async function POST(request: Request) {
    try {
        const userId = await getUserId();
        const body = await request.json();

        const contractor = await prisma.contractor.create({
            data: {
                name: body.name,
                authorizedPerson: body.authorizedPerson || null,
                phone: body.phone || null,
                email: body.email || null,
                address: body.address || null,
                website: body.website || null,
                taxNumber: body.taxNumber || null,
                specialties: body.specialties || null,
                notes: body.notes || null,
                ownerId: userId,
            }
        });

        return NextResponse.json(contractor, { status: 201 });
    } catch (error) {
        console.error("Error creating contractor:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
