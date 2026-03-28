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

        // ⚡ Bolt: Push grouping and counting to the DB layer to avoid transferring
        // all parcel records into Node.js memory. Also reuse the shared Prisma
        // singleton instead of creating a new PrismaClient to avoid connection issues.
        const grouped = await prisma.parcel.groupBy({
            by: ['crmStage'],
            where,
            _count: {
                _all: true
            }
        });

        // The default stage for parcels without crmStage explicitly set in code logic
        // but default is "NEW_LEAD" in schema.

        // Count parcels by stage
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];

        const data = stages.map(stage => {
            // Need to correctly accumulate counts if DB returns both nullish and explicit "NEW_LEAD"
            const count = grouped
                .filter(g => (g.crmStage || "NEW_LEAD") === stage)
                .reduce((sum, g) => sum + g._count._all, 0);

            return {
                stage,
                count
            };
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
