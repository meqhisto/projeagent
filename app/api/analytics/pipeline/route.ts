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

        // ⚡ Bolt: Push calculation to database to avoid loading all parcels into memory
        const groupData = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: { _all: true }
        });

        // Accumulate counts, handling nullish values as "NEW_LEAD"
        const stageCounts: Record<string, number> = {};
        for (const item of groupData) {
            const stage = item.crmStage || "NEW_LEAD";
            stageCounts[stage] = (stageCounts[stage] || 0) + item._count._all;
        }

        // Count parcels by stage
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const data = stages.map(stage => ({
            stage,
            count: stageCounts[stage] || 0
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
