import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = 'nodejs';

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

        // ⚡ Bolt: Push grouping to the database layer to avoid pulling all records into memory
        const groupStats = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: { _all: true }
        });

        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const counts = stages.reduce((acc, stage) => {
            acc[stage] = 0;
            return acc;
        }, {} as Record<string, number>);

        groupStats.forEach(stat => {
            // Null values fall back to NEW_LEAD
            const stage = stat.crmStage || "NEW_LEAD";
            if (counts[stage] !== undefined) {
                counts[stage] += stat._count._all;
            } else {
                counts[stage] = stat._count._all;
            }
        });

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
