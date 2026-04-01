import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = 'nodejs';

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

        // BOLT OPTIMIZATION: Push counting to database via groupBy instead of fetching all records
        // Expected Impact: Reduces database payload from O(N) to O(1) and decreases Node.js memory footprint
        const groupedCounts = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true
            }
        });

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];

        const dataMap: Record<string, number> = {};
        stages.forEach(stage => {
            dataMap[stage] = 0;
        });

        groupedCounts.forEach(item => {
            const stage = item.crmStage || "NEW_LEAD";
            if (dataMap[stage] !== undefined) {
                dataMap[stage] += item._count._all;
            }
        });

        const data = stages.map(stage => ({
            stage,
            count: dataMap[stage]
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
