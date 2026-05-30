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

        // Get contractor IDs to fetch aggregated ratings
        const contractorIds = contractors.map(c => c.id);

        let ratingAverages: Array<{ contractorId: number; _avg: { overallScore: number | null } }> = [];
        if (contractorIds.length > 0) {
            const result = await prisma.contractorRating.groupBy({
                by: ['contractorId'],
                where: { contractorId: { in: contractorIds } },
                _avg: { overallScore: true }
            });
            ratingAverages = result as unknown as Array<{ contractorId: number; _avg: { overallScore: number | null } }>;
        }

        // Create a map for fast lookup
        const avgScoreMap = new Map(
            ratingAverages.map(ra => [ra.contractorId, ra._avg.overallScore])
        );

        // Her firma için ortalama puan hesapla (DB'den alınan ile)
        const contractorsWithAvg = contractors.map(c => {
            const avgScore = avgScoreMap.get(c.id) ?? null;
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
