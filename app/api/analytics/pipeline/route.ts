import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; //⚡ Bolt: Optimized by replacing new PrismaClient() with shared instance

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

        // ⚡ Bolt: Optimized by using prisma.groupBy to count records directly in the DB
        // rather than fetching all rows and filtering them in memory.
        const stageCounts = await prisma.parcel.groupBy({
            by: ['crmStage'],
            _count: { _all: true },
            where
        });

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const data = stages.map(stage => {
            // Find counts that match this stage, or if it's NEW_LEAD, also sum up null/empty stages if any exist
            const count = stageCounts.reduce((sum, item) => {
                const itemStage = item.crmStage || "NEW_LEAD";
                if (itemStage === stage) {
                    return sum + item._count._all;
                }
                return sum;
            }, 0);

            return { stage, count };
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
