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

        // Optimization: Push aggregation to the database layer instead of loading all rows into Node.js memory
        // This reduces database transfer from O(N) to O(1) and eliminates memory allocation spikes.
        const grouped = await prisma.parcel.groupBy({
            by: ["crmStage"],
            _count: { _all: true },
            where
        });

        const countsMap = new Map<string, number>();
        for (const item of grouped) {
            const stage = item.crmStage || "NEW_LEAD";
            countsMap.set(stage, (countsMap.get(stage) || 0) + item._count._all);
        }

        // Count parcels by stage
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const data = stages.map(stage => ({
            stage,
            count: countsMap.get(stage) || 0
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
