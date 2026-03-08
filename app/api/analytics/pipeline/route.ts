import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

        // ⚡ Bolt: Replaced fetching all full parcel records with `groupBy` to push grouping/aggregation
        // to the database layer. This drastically reduces Node.js memory consumption and network load
        // when processing large numbers of parcels.
        const grouped = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true
            }
        });

        // Create a fast lookup map for the database group counts
        const countMap = grouped.reduce((acc, curr) => {
            const stage = curr.crmStage || "NEW_LEAD";
            acc[stage] = (acc[stage] || 0) + curr._count._all;
            return acc;
        }, {} as Record<string, number>);

        // Count parcels by stage
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const data = stages.map(stage => ({
            stage,
            count: countMap[stage] || 0
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
