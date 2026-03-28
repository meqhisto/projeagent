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

        // ⚡ Bolt: Use Promise.all and database-level aggregations instead of fetching
        // all properties to memory and grouping in Node.js.
        // Also removed new PrismaClient() usage in favor of shared singleton.

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const [
            totalParcelsCount,
            activeParcelsCount,
            contractParcelsCount,
            thisMonthAddedCount,
            previousMonthAddedCount,
            areaAggregation
        ] = await Promise.all([
            // Total parcels
            prisma.parcel.count({ where }),

            // Active parcels
            prisma.parcel.count({
                where: {
                    ...where,
                    crmStage: { in: ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT"] }
                }
            }),

            // Contract parcels
            prisma.parcel.count({
                where: {
                    ...where,
                    crmStage: "CONTRACT"
                }
            }),

            // Added this month
            prisma.parcel.count({
                where: {
                    ...where,
                    createdAt: { gte: thirtyDaysAgo }
                }
            }),

            // Added previous month
            prisma.parcel.count({
                where: {
                    ...where,
                    createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
                }
            }),

            // Total area sum (for total value)
            prisma.parcel.aggregate({
                where,
                _sum: {
                    area: true
                }
            })
        ]);

        const conversionRate = totalParcelsCount > 0
            ? (contractParcelsCount / totalParcelsCount) * 100
            : 0;

        const parcelTrend = previousMonthAddedCount > 0
            ? ((thisMonthAddedCount - previousMonthAddedCount) / previousMonthAddedCount) * 100
            : thisMonthAddedCount > 0 ? 100 : 0;

        // Estimated total value (area * average m² price)
        const avgPricePerM2 = 50000; // TL - could be made dynamic
        const totalValue = (areaAggregation._sum.area || 0) * avgPricePerM2;

        // Average ROI (simplified - would need actual feasibility data)
        const avgROI = 28.5; // Placeholder

        return NextResponse.json({
            totalParcels: totalParcelsCount,
            activeParcels: activeParcelsCount,
            conversionRate: parseFloat(conversionRate.toFixed(1)),
            avgROI,
            thisMonthAdded: thisMonthAddedCount,
            totalValue,
            trends: {
                parcels: parcelTrend >= 0 ? `+${parcelTrend.toFixed(0)}%` : `${parcelTrend.toFixed(0)}%`,
                roi: "+3.2%" // Placeholder
            }
        });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Analytics KPIs error:", error);
        return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 });
    }
}
