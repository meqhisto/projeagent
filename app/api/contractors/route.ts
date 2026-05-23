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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

        // ⚡ Bolt Optimization: Use `_count` instead of fetching full related nested arrays
        // to avoid DB transfer latency and Node.js memory bloat when only displaying counts.
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
        const avgMap = new Map<number, number | null>();

        if (contractorIds.length > 0) {
            // ⚡ Bolt Optimization: Use database-level `groupBy` and `_avg` to calculate
            // the average scores directly in Postgres instead of looping over massive arrays in Node.
            const ratingsAggregations = await prisma.contractorRating.groupBy({
                by: ['contractorId'],
                where: { contractorId: { in: contractorIds } },
                _avg: {
                    reliability: true,
                    quality: true,
                    communication: true,
                    pricing: true,
                }
            });

            for (const agg of ratingsAggregations) {
                const { _avg, contractorId } = agg;
                if (_avg.reliability != null && _avg.quality != null && _avg.communication != null && _avg.pricing != null) {
                    avgMap.set(contractorId, (_avg.reliability + _avg.quality + _avg.communication + _avg.pricing) / 4);
                }
            }
        }

        const contractorsWithAvg = contractors.map(c => ({
            ...c,
            averageScore: avgMap.get(c.id) ?? null
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
