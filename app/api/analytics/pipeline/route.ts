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

        // Optimization: Use database aggregation instead of fetching all rows into memory
        // and iterating over them in Node.js. Also maps fallback stage (null/undefined) to "NEW_LEAD".
        const groupedParcels = await prisma.parcel.groupBy({
            by: ['crmStage'],
            _count: { _all: true },
            where
        });

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];

        // Initialize counts to 0
        const countsByStage: Record<string, number> = {};
        stages.forEach(stage => countsByStage[stage] = 0);

        // Accumulate counts, handling null/empty strings by defaulting to "NEW_LEAD"
        groupedParcels.forEach(group => {
            const stage = group.crmStage || "NEW_LEAD";
            if (stages.includes(stage)) {
                countsByStage[stage] = (countsByStage[stage] || 0) + group._count._all;
            } else {
                // If it's an unrecognized stage, we can optionally group it into NEW_LEAD or ignore it.
                // Replicating original logic which just checked if it matched a known stage.
                // `(p.crmStage || "NEW_LEAD") === stage` implies recognized stages only.
            }
        });

        const data = stages.map(stage => ({
            stage,
            count: countsByStage[stage]
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
