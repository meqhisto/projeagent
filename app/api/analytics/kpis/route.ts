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

        const parcels = await prisma.parcel.findMany({
            where,
            include: {
                zoning: true
            }
        });

        // Calculate KPIs
        const totalParcels = parcels.length;

        const activeParcels = parcels.filter(p =>
            ["NEW_LEAD", "CONTACTED", "ANALYSIS", "OFFER_SENT"].includes(p.crmStage)
        ).length;

        const contractParcels = parcels.filter(p => p.crmStage === "CONTRACT").length;
        const conversionRate = totalParcels > 0 ? (contractParcels / totalParcels) * 100 : 0;

        // This month (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thisMonthAdded = parcels.filter(p =>
            new Date(p.createdAt) >= thirtyDaysAgo
        ).length;

        // Previous month for trend
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const previousMonthAdded = parcels.filter(p => {
            const date = new Date(p.createdAt);
            return date >= sixtyDaysAgo && date < thirtyDaysAgo;
        }).length;

        const parcelTrend = previousMonthAdded > 0
            ? ((thisMonthAdded - previousMonthAdded) / previousMonthAdded) * 100
            : thisMonthAdded > 0 ? 100 : 0;

        // Estimated total value (area * average m² price)
        const avgPricePerM2 = 50000; // TL - could be made dynamic
        const totalValue = parcels.reduce((sum, p) => sum + (p.area || 0) * avgPricePerM2, 0);

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
export const runtime = 'nodejs';
