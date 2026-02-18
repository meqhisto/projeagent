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

        const parcels = await prisma.parcel.findMany({ where });

        // Count parcels by stage
        const stages = ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT", "CONTRACT", "LOST"];
        const data = stages.map(stage => ({
            stage,
            count: parcels.filter(p => (p.crmStage || "NEW_LEAD") === stage).length
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
export const runtime = 'nodejs';
