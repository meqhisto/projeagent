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

        // Push aggregation to database instead of loading everything into Node.js memory
        const groupedParcels = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true
            }
        });

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];

        // Map database results to expected format
        const data = stages.map(stage => {
            let count = 0;
            for (const group of groupedParcels) {
                // If crmStage is null/undefined in DB, it conceptually belongs to "NEW_LEAD"
                const groupStage = group.crmStage || "NEW_LEAD";
                if (groupStage === stage) {
                    count += group._count._all;
                }
            }
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
