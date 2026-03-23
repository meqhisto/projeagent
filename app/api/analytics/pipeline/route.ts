import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = "nodejs";

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

        // ⚡ Bolt: Replaced findMany + in-memory mapping with database-level .groupBy()
        // Why: Avoids fetching entire Parcel table into Node.js memory just to count rows by stage.
        // Impact: Reduces DB memory footprint and payload size, lowering latency from O(N) objects to O(1) query result.
        const groupByResult = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true,
            },
        });

        // Map and accumulate counts ensuring that any null/missing stages fall back to NEW_LEAD
        const stageCounts: Record<string, number> = {
            "NEW_LEAD": 0,
            "CONTACTED": 0,
            "ANALYSIS": 0,
            "OFFER_SENT": 0,
            "CONTRACT": 0,
            "LOST": 0
        };

        for (const group of groupByResult) {
            const stage = group.crmStage || "NEW_LEAD";
            if (stageCounts[stage] !== undefined) {
                stageCounts[stage] += group._count._all;
            } else {
                // If there's an unexpected stage, add it or fall back
                stageCounts[stage] = group._count._all;
            }
        }

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const data = stages.map(stage => ({
            stage,
            count: stageCounts[stage] || 0
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
