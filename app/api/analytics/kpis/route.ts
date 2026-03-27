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

        // ⚡ Bolt Optimization:
        // Replaced in-memory filtering of a full `.findMany()` query with multiple `.count()`
        // and `.aggregate()` database queries wrapped in a `Promise.all()`.
        // This stops downloading thousands of full parcel rows into Node.js and instead
        // shifts processing to PostgreSQL (returning O(1) bytes of counts and sums).
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const [
            totalParcels,
            activeParcels,
            contractParcels,
            thisMonthAdded,
            previousMonthAdded,
            aggregateValue
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
                where: { ...where, crmStage: "CONTRACT" }
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

            // Aggregate area
            prisma.parcel.aggregate({
                where,
                _sum: { area: true }
            })
        ]);

        const conversionRate = totalParcels > 0 ? (contractParcels / totalParcels) * 100 : 0;

        const parcelTrend = previousMonthAdded > 0
            ? ((thisMonthAdded - previousMonthAdded) / previousMonthAdded) * 100
            : thisMonthAdded > 0 ? 100 : 0;

        // Estimated total value (area * average m² price)
        const avgPricePerM2 = 50000; // TL - could be made dynamic
        const totalAreaSum = aggregateValue._sum.area || 0;
        const totalValue = totalAreaSum * avgPricePerM2;

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
