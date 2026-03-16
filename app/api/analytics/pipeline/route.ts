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

        // Count parcels grouped by stage efficiently in DB instead of fetching all parcels
        // ⚡ Bolt Optimization: Use groupBy to avoid loading all parcels into Node.js memory
        // and avoid instantiating large numbers of objects unnecessarily.
        const stageCounts = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: { _all: true }
        });

        // Map groupBy results to the expected format
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];

        // Build a lookup map from the groupBy results
        const countMap = new Map();
        for (const item of stageCounts) {
            const stageName = item.crmStage || "NEW_LEAD";
            const currentCount = countMap.get(stageName) || 0;
            countMap.set(stageName, currentCount + item._count._all);
        }

        const data = stages.map(stage => ({
            stage,
            count: countMap.get(stage) || 0
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
