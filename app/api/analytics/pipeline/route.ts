import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = "nodejs";

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

        // ⚡ Bolt Optimization: Removed findMany() that fetched all records into memory.
        // Using groupBy pushes the aggregation to the database, drastically reducing memory usage and transfer latency.
        const groupedStages = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: { _all: true }
        });

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];

        // ⚡ Bolt Optimization: Map the grouped results in Node.js, accumulating counts
        // for fallback keys correctly using item._count._all.
        const counts = groupedStages.reduce((acc: Record<string, number>, item) => {
            const stage = item.crmStage || "NEW_LEAD";
            acc[stage] = (acc[stage] || 0) + item._count._all;
            return acc;
        }, {});

        const data = stages.map(stage => ({
            stage,
            count: counts[stage] || 0
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
