import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export async function GET() {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        // Build query based on role
        const baseWhere = isAdmin((user as any).role as string)
            ? {} // Admin sees all
            : {
                OR: [
                    { ownerId: userId },
                    { assignedTo: userId }
                ]
            };

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Optimization: Replace `findMany` with concurrent database-level aggregations
        // to prevent overfetching all records into memory.
        const [
            totalParcels,
            activeParcels,
            contractParcels,
            thisMonthAdded,
            previousMonthAdded,
            areaAggregation
        ] = await Promise.all([
            // totalParcels
            prisma.parcel.count({ where: baseWhere }),

            // activeParcels
            prisma.parcel.count({
                where: {
                    ...baseWhere,
                    crmStage: { in: ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT"] }
                }
            }),

            // contractParcels
            prisma.parcel.count({
                where: {
                    ...baseWhere,
                    crmStage: "CONTRACT"
                }
            }),

            // thisMonthAdded
            prisma.parcel.count({
                where: {
                    ...baseWhere,
                    createdAt: { gte: thirtyDaysAgo }
                }
            }),

            // previousMonthAdded
            prisma.parcel.count({
                where: {
                    ...baseWhere,
                    createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
                }
            }),

            // area aggregation for totalValue
            prisma.parcel.aggregate({
                where: baseWhere,
                _sum: {
                    area: true
                }
            })
        ]);

        const conversionRate = totalParcels > 0 ? (contractParcels / totalParcels) * 100 : 0;

        const parcelTrend = previousMonthAdded > 0
            ? ((thisMonthAdded - previousMonthAdded) / previousMonthAdded) * 100
            : thisMonthAdded > 0 ? 100 : 0;

        // Estimated total value (area * average m² price)
        const avgPricePerM2 = 50000; // TL - could be made dynamic
        const totalValue = (areaAggregation._sum.area || 0) * avgPricePerM2;

        // Average ROI (simplified - would need actual feasibility data)
        const avgROI = 28.5; // Placeholder

        return NextResponse.json({
            totalParcels,
            activeParcels,
            conversionRate: parseFloat(conversionRate.toFixed(1)),
            avgROI,
            thisMonthAdded,
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
