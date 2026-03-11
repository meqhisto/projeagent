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

        // Optimization: Use database-level grouping instead of fetching all records into memory
        const groupedParcels = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true
            }
        });

        // Count parcels by stage
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const data = stages.map(stage => {
            // Sum the counts for the current stage. Treat null/empty crmStage as "NEW_LEAD"
            // to maintain exact backward compatibility with original logic: (p.crmStage || "NEW_LEAD")
            const count = groupedParcels
                .filter(g => (g.crmStage || "NEW_LEAD") === stage)
                .reduce((sum, g) => sum + g._count._all, 0);

            return {
                stage,
                count
            };
        });

        return NextResponse.json(data);
    } catch (error: any) {
        if (error?.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Pipeline analytics error:", error);
        return NextResponse.json({ error: "Failed to fetch pipeline data" }, { status: 500 });
    }
}
