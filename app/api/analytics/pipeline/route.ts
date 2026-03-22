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

        // ⚡ Bolt Optimization: Use Prisma's groupBy to push processing to the
        // database layer, preventing OOM issues with large datasets that occur
        // when using findMany() to count in-memory.
        const grouped = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true
            }
        });

        // Count parcels by stage
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];

        // Accumulate counts, ensuring null/default values map correctly
        const countMap: Record<string, number> = {};
        stages.forEach(stage => countMap[stage] = 0);

        grouped.forEach(item => {
            const stage = item.crmStage || "NEW_LEAD";
            if (countMap[stage] !== undefined) {
                countMap[stage] += item._count._all;
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
