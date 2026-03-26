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

        // ⚡ Bolt Optimization: Replace O(n) findMany + array filter with O(1) DB groupBy
        const groupedParcels = await prisma.parcel.groupBy({
            by: ["crmStage"],
            where,
            _count: { _all: true }
        });

        // Initialize stage counts to 0
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const stageMap: Record<string, number> = {};
        stages.forEach(stage => { stageMap[stage] = 0; });

        // Populate counts from DB aggregation results
        groupedParcels.forEach(group => {
            const stage = group.crmStage || "NEW_LEAD";
            if (stageMap[stage] !== undefined) {
                stageMap[stage] += group._count._all; // Accumulate counts per memory guidelines
            } else {
                stageMap[stage] = group._count._all;
            }
        });

        const data = stages.map(stage => ({
            stage,
            count: stageMap[stage] || 0
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
