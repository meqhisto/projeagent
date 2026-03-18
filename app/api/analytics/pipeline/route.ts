import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export async function GET() {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        // Build query based on role
        const where = isAdmin((user as any).role as string)
            ? {} // Admin sees all
            : {
                OR: [
                    { ownerId: userId },
                    { assignedTo: userId }
                ]
            };

        // BOLT OPTIMIZATION: Push processing to database layer and replace new PrismaClient instantiation
        // Previously: used findMany() to fetch all records into Node.js memory just to count them
        // Now: Uses Prisma's groupBy & _count directly on the database + singleton PrismaClient to avoid connection exhaustion
        const groupedParcels = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: { _all: true }
        });

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];

        // Ensure accurate counting by properly accumulating counts of nullish keys into NEW_LEAD
        const countsByStage = groupedParcels.reduce((acc, curr) => {
            const stage = curr.crmStage || "NEW_LEAD";
            acc[stage] = (acc[stage] || 0) + curr._count._all;
            return acc;
        }, {} as Record<string, number>);

        const data = stages.map(stage => ({
            stage,
            count: countsByStage[stage] || 0
        }));

        return NextResponse.json(data);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Pipeline analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch pipeline data" }, { status: 500 });
    }
}
