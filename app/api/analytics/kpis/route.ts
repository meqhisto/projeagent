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

        // This month (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Previous month for trend
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Calculate KPIs via database aggregations to avoid processing large arrays in Node.js memory
        // and resolve N+1 style full table data loading.
        const [
            totalParcels,
            activeParcels,
            contractParcels,
            thisMonthAdded,
            previousMonthAdded,
            totalAreaAgg
        ] = await Promise.all([
            prisma.parcel.count({ where }),
            prisma.parcel.count({
                where: {
                    ...where,
                    crmStage: { in: ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT"] }
                }
            }),
            prisma.parcel.count({
                where: {
                    ...where,
                    crmStage: "CONTRACT"
                }
            }),
            prisma.parcel.count({
                where: {
                    ...where,
                    createdAt: { gte: thirtyDaysAgo }
                }
            }),
            prisma.parcel.count({
                where: {
                    ...where,
                    createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo }
                }
            }),
            prisma.parcel.aggregate({
                where,
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
        const totalValue = (totalAreaAgg._sum.area || 0) * avgPricePerM2;

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
