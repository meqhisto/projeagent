import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

        // ⚡ Bolt: Fetch counts grouped by stage directly from DB to avoid loading all parcels into Node.js memory
        // This dramatically reduces payload from DB and Memory Usage for O(n) filtering.
        const stageCounts = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true
            }
        });

        // Initialize counts map for quick O(1) lookups
        const stageCountMap: Record<string, number> = {};
        for (const item of stageCounts) {
            // If crmStage is null/undefined in some old records, we treat it as NEW_LEAD
            const stage = item.crmStage || "NEW_LEAD";
            stageCountMap[stage] = (stageCountMap[stage] || 0) + item._count._all;
        }

        // Output all expected stages (with zero counts for missing ones)
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const data = stages.map(stage => ({
            stage,
            count: stageCountMap[stage] || 0
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
