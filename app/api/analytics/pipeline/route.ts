import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = 'nodejs';

export async function GET() {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        // Build query based on role
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const where = isAdmin((user as any).role as string)
            ? {} // Admin sees all
            : {
                OR: [
                    { ownerId: userId },
                    { assignedTo: userId }
                ]
            };

        // ⚡ Bolt: Push aggregation to DB instead of fetching all records to memory
        // Expected impact: O(1) memory usage regardless of dataset size, much faster execution
        const grouped = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true
            }
        });

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const countMap: Record<string, number> = {};

        stages.forEach(stage => { countMap[stage] = 0; });

        // ⚡ Bolt: Accumulate counts for nullish/default values to prevent overwriting
        grouped.forEach(group => {
            const stage = group.crmStage || "NEW_LEAD";
            if (countMap[stage] !== undefined) {
                countMap[stage] += group._count._all;
            } else {
                countMap[stage] = group._count._all;
            }
        });

        const data = stages.map(stage => ({
            stage,
            count: countMap[stage]
        }));

        return NextResponse.json(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Pipeline analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch pipeline data" }, { status: 500 });
    }
}
