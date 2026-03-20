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

        // Optimization: Push processing to DB using groupBy and prevent loading all records into Node.js memory
        // and safely handle default/nullish values by accumulating counts.
        const groupedParcels = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true
            }
        });

        // Initialize counts mapped to their stages
        const counts: Record<string, number> = {
            "NEW_LEAD": 0,
            "CONTACTED": 0,
            "ANALYSIS": 0,
            "OFFER_SENT": 0,
            "CONTRACT": 0,
            "LOST": 0
        };

        // Accumulate counts, using NEW_LEAD as a fallback for any missing/null stage
        groupedParcels.forEach(g => {
            const stage = g.crmStage || "NEW_LEAD";
            if (counts[stage] !== undefined) {
                counts[stage] += g._count._all;
            } else {
                counts["NEW_LEAD"] += g._count._all; // if random unexpected stage, group into new lead
            }
        });

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const data = stages.map(stage => ({
            stage,
            count: counts[stage]
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
