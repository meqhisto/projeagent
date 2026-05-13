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

        // ⚡ Bolt Optimization: Use _count to avoid fetching full related arrays
        // Impact: Reduces API payload size and memory usage by preventing N+1 array serialization
        const contractors = await prisma.contractor.findMany({
            where: baseWhere,
            include: {
                _count: {
                    select: {
                        ratings: true,
                        matches: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const contractorIds = contractors.map(c => c.id);

        // ⚡ Bolt Optimization: Push aggregate calculation to database
        // Impact: Replaces O(N*M) in-memory array iteration with a single O(1) DB round-trip
        const aggregations = await prisma.contractorRating.groupBy({
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
                pricing: true
            }
        });

        const averagesMap = new Map(aggregations.map(agg => {
            const avgScore = (
                (agg._avg.reliability || 0) +
                (agg._avg.quality || 0) +
                (agg._avg.communication || 0) +
                (agg._avg.pricing || 0)
            ) / 4;
            return [agg.contractorId, avgScore];
        }));

        const contractorsWithAvg = contractors.map(c => {
            return {
                ...c,
                averageScore: c._count.ratings > 0 ? averagesMap.get(c.id) : null
            };
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
