import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = 'nodejs';

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

        // ⚡ BOLT OPTIMIZATION: Prevent N+1 and overfetching by only requesting required rating values for the average calculation,
        // and using _count for relations instead of full objects.
        const contractors = await prisma.contractor.findMany({
            where: baseWhere,
            include: {
                ratings: {
                    select: {
                        reliability: true,
                        quality: true,
                        communication: true,
                        pricing: true
                    }
                },
                _count: {
                    select: {
                        matches: true,
                        ratings: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        // Her firma için ortalama puan hesapla
        const contractorsWithAvg = contractors.map(c => {
            const avgScore = c.ratings.length > 0
                ? c.ratings.reduce((sum, r) => sum + ((r.reliability + r.quality + r.communication + r.pricing) / 4), 0) / c.ratings.length
                : null;

            // Remove the ratings array to save payload size, we only need the count on the frontend
            const { ratings, ...rest } = c;
            return { ...rest, averageScore: avgScore };
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
