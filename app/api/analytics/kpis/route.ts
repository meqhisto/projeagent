import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

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

        // ⚡ Bolt Optimization: Replace findMany() with database-level aggregation.
        // Avoid loading thousands of large Parcel objects (and joined Zoning records)
        // into Node.js memory just to compute counts and a sum.

        // 1. Get totals and sums
        const [aggregateResult, totalParcelsCount, activeParcelsCount, contractParcelsCount] = await Promise.all([
            prisma.parcel.aggregate({
                where,
                _sum: { area: true }
            }),
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
            })
        ]);

        const totalParcels = totalParcelsCount;
        const activeParcels = activeParcelsCount;
        const contractParcels = contractParcelsCount;
        const conversionRate = totalParcels > 0 ? (contractParcels / totalParcels) * 100 : 0;

        // 2. Trend Calculations (last 30 days and 30-60 days)
        const now = new Date();

        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);

        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(now.getDate() - 60);

        const [thisMonthAdded, previousMonthAdded] = await Promise.all([
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
            })
        ]);

        const parcelTrend = previousMonthAdded > 0
            ? ((thisMonthAdded - previousMonthAdded) / previousMonthAdded) * 100
            : thisMonthAdded > 0 ? 100 : 0;

        // Estimated total value (area * average m² price)
        const avgPricePerM2 = 50000; // TL - could be made dynamic
        const totalValue = (aggregateResult._sum.area || 0) * avgPricePerM2;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Analytics KPIs error:", error);
        return NextResponse.json({ error: "Failed to fetch KPIs" }, { status: 500 });
    }
}
