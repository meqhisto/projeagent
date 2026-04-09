import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ⚡ Bolt: Used shared singleton instead of instantiating new PrismaClient to avoid connection exhaustion

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

        // ⚡ Bolt: Replaced findMany() with groupBy() to push aggregation to the database,
        // reducing memory usage and Node.js processing time, especially for large datasets.
        const groupedStages = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true
            }
        });

        // Initialize counts for all stages
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const stageCounts: Record<string, number> = {};
        stages.forEach(stage => stageCounts[stage] = 0);

        // Accumulate the counts. Nullish or empty crmStages are treated as NEW_LEAD
        groupedStages.forEach(item => {
            const stage = item.crmStage || "NEW_LEAD";
            if (stageCounts[stage] !== undefined) {
                stageCounts[stage] += item._count._all; // Accumulate counts safely
            } else {
                 stageCounts[stage] = item._count._all;
            }
        });

        const data = stages.map(stage => ({
            stage,
            count: stageCounts[stage] || 0
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
