import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

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

        // BOLT OPTIMIZATION: Replaced findMany with groupBy to push aggregations to the DB.
        // Also removed new PrismaClient() in favor of shared singleton.
        // Impact: O(1) memory usage instead of O(N), prevents Node.js memory bloat for large datasets.
        const groupedParcels = await prisma.parcel.groupBy({
            by: ['crmStage'],
            _count: { _all: true },
            where
        });

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];

        // Initialize counts
        const countMap: Record<string, number> = {};
        stages.forEach(stage => countMap[stage] = 0);

        // Map grouped results and accumulate correctly per memory rules
        groupedParcels.forEach(group => {
            const stage = group.crmStage || "NEW_LEAD";
            if (countMap[stage] !== undefined) {
                countMap[stage] += group._count._all;
            } else {
                countMap[stage] = group._count._all; // Fallback for unknown stages
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
