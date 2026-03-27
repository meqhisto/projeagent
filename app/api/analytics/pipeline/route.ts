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

        // ⚡ Bolt Optimization:
        // Use database-level grouping instead of transferring all parcel rows into Node.js memory.
        const groupedParcels = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: { _all: true }
        });

        // Initialize counts for all stages
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const counts: Record<string, number> = {};
        stages.forEach(s => counts[s] = 0);

        // Accumulate counts correctly (handling null/undefined crmStage defaults to NEW_LEAD)
        groupedParcels.forEach(group => {
            const stage = group.crmStage || "NEW_LEAD";
            if (counts[stage] !== undefined) {
                counts[stage] += group._count._all;
            } else {
                counts[stage] = group._count._all;
            }
        });

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
