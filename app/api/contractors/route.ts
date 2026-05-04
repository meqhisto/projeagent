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

        // ⚡ Bolt Optimization: Use _count to prevent fetching full relation objects (ratings, matches).
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

        // ⚡ Bolt Optimization: Calculate average rating using database aggregation instead of in-memory maps.
        const contractorIds = contractors.map(c => c.id);

        let ratingAverages: any[] = [];
        if (contractorIds.length > 0) {
            ratingAverages = await prisma.contractorRating.groupBy({
                by: ['contractorId'],
                where: {
                    contractorId: { in: contractorIds }
                },
                _avg: {
                    reliability: true,
                    quality: true,
                    communication: true,
                    pricing: true
                }
            });
        }

        // Map aggregated scores back to contractors
        const contractorsWithAvg = contractors.map(c => {
            const avg = ratingAverages.find(r => r.contractorId === c.id);
            let calculatedAvg = null;
            if (avg && avg._avg) {
                const sums = (avg._avg.reliability || 0) + (avg._avg.quality || 0) + (avg._avg.communication || 0) + (avg._avg.pricing || 0);
                calculatedAvg = sums / 4;
            }
            return {
                ...c,
                averageScore: calculatedAvg
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
