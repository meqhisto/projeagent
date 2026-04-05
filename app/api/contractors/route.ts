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

        // ⚡ Bolt Optimization:
        // 💡 What: Replaced fetching full 'ratings' and 'matches' relations with Prisma's '_count' aggregate, and pushed average rating calculations to the database using 'groupBy'.
        // 🎯 Why: Previously, fetching full relations caused large network payloads and memory usage, essentially acting like an N+1 when calculating averages in Node.js memory.
        // 📊 Impact: Significantly reduces database data transfer size and Node.js memory overhead. List operations scale optimally as matches/ratings grow to thousands.
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

        const ratingStats = await prisma.contractorRating.groupBy({
            by: ['contractorId'],
            where: {
                contractorId: {
                    in: contractorIds
                }
            },
            _avg: {
                reliability: true,
                quality: true,
                communication: true,
                pricing: true,
            }
        });

        const ratingStatsMap = new Map(
            ratingStats.map(stat => [stat.contractorId, stat])
        );

        // Her firma için ortalama puan hesapla
        const contractorsWithAvg = contractors.map(c => {
            const stat = ratingStatsMap.get(c.id);
            let avgScore = null;
            if (stat && stat._avg.reliability !== null && stat._avg.quality !== null && stat._avg.communication !== null && stat._avg.pricing !== null) {
                avgScore = (stat._avg.reliability + stat._avg.quality + stat._avg.communication + stat._avg.pricing) / 4;
            }
            return { ...c, averageScore: avgScore };
        });

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
