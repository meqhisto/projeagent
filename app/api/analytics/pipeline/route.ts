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

        // ⚡ BOLT OPTIMIZATION: Push counting to DB level
        // Replaced loading all parcels into memory with DB-level grouping
        const groupedStages = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true
            }
        });

        // Count parcels by stage
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];

        // Sum any multiple matches if there were nulls that mapped to NEW_LEAD
        // To be safe as per memory instructions
        const finalData = stages.map(stage => {
            const count = groupedStages.reduce((sum, g) => {
                if ((g.crmStage || "NEW_LEAD") === stage) {
                     return sum + g._count._all;
                }
                return sum;
            }, 0);
            return {
                stage,
                count
            };
        });


        return NextResponse.json(finalData);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Pipeline analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch pipeline data" }, { status: 500 });
    }
}
