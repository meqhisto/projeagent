export const runtime = 'nodejs';
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

        // ⚡ Bolt: Push aggregation to DB to avoid loading all parcels into Node.js memory
        // Expected impact: Significant reduction in memory usage and network transfer for large datasets
        const stageGroups = await prisma.parcel.groupBy({
            by: ['crmStage'],
            _count: { _all: true },
            where
        });

        // Count parcels by stage
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const data = stages.map(stage => {
            // Map null/empty crmStage to NEW_LEAD
            const count = stageGroups
                .filter(g => (g.crmStage || "NEW_LEAD") === stage)
                .reduce((sum, g) => sum + g._count._all, 0);

            return {
                stage,
                count
            };
        });

        return NextResponse.json(data);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Pipeline analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch pipeline data" }, { status: 500 });
    }
}
