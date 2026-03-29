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

        // Count parcels by stage using database aggregation instead of fetching all parcels
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];

        // Use Prisma groupBy to count parcels per stage directly in DB
        const groupedParcels = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: { _all: true }
        });

        // Initialize counts to 0
        const stageCounts: Record<string, number> = {};
        stages.forEach(stage => stageCounts[stage] = 0);

        // Map database results to counts
        groupedParcels.forEach(group => {
            const stage = group.crmStage || "NEW_LEAD";
            if (stageCounts[stage] !== undefined) {
                stageCounts[stage] += group._count._all;
            }
        });

        const data = stages.map(stage => ({
            stage,
            count: stageCounts[stage]
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
