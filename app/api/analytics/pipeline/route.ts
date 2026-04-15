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

        // ⚡ Bolt Optimization: Replace in-memory array filtering with database-level grouping
        // and avoid instantiating new PrismaClient.
        const grouped = await prisma.parcel.groupBy({
            by: ['crmStage'],
            _count: { _all: true },
            where
        });

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const counts: Record<string, number> = {};
        stages.forEach(s => counts[s] = 0);

        grouped.forEach(item => {
            const stage = item.crmStage || "NEW_LEAD";
            if (counts[stage] !== undefined) {
                counts[stage] += item._count._all;
            }
        });

        const data = stages.map(stage => ({
            stage,
            count: counts[stage]
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
