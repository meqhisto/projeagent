import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

// GET - Portfolio statistics
export async function GET() {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        const userRole = (user as any).role;

        // Build where clause based on role
        const propertyWhere = isAdmin(userRole) ? {} : { ownerId: userId };

        // Get all properties with related data
        const properties = await prisma.property.findMany({
            where: propertyWhere,
            include: {
                units: true,
                transactions: {
                    where: {
                        date: {
                            gte: new Date(new Date().getFullYear(), 0, 1) // This year
                        }
                    }
                }
            }
        });

        // Calculate statistics
        const totalProperties = properties.length;
        const totalValue = properties.reduce((sum, p) => sum + (p.currentValue || 0), 0);
        const totalPurchaseValue = properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);

        // Status counts
        const statusCounts = {
            AVAILABLE: 0,
            RENTED: 0,
            SOLD: 0,
            UNDER_CONSTRUCTION: 0,
            RENOVATION: 0,
            RESERVED: 0
        };
        properties.forEach(p => {
            if (statusCounts[p.status as keyof typeof statusCounts] !== undefined) {
                statusCounts[p.status as keyof typeof statusCounts]++;
            }
        });

        // Type counts
        const typeCounts: Record<string, number> = {};
        properties.forEach(p => {
            typeCounts[p.type] = (typeCounts[p.type] || 0) + 1;
        });

        // Unit statistics
        const allUnits = properties.flatMap(p => p.units);
        const totalUnits = allUnits.length;
        const rentedUnits = allUnits.filter(u => u.status === 'RENTED').length;
        const occupancyRate = totalUnits > 0 ? (rentedUnits / totalUnits) * 100 : 0;

        // Financial calculations
        const allTransactions = properties.flatMap(p => p.transactions);

        const incomeTypes = ['RENT_INCOME', 'SALE', 'DEPOSIT'];
        const totalIncome = allTransactions
            .filter(t => incomeTypes.includes(t.type))
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = allTransactions
            .filter(t => !incomeTypes.includes(t.type))
            .reduce((sum, t) => sum + t.amount, 0);

        // Monthly rent potential
        const monthlyRentPotential = properties.reduce((sum, p) => sum + (p.monthlyRent || 0), 0)
            + allUnits.reduce((sum, u) => sum + (u.monthlyRent || 0), 0);

        // Actual monthly rent (from rented properties/units)
        const actualMonthlyRent = properties
            .filter(p => p.status === 'RENTED')
            .reduce((sum, p) => sum + (p.monthlyRent || 0), 0)
            + allUnits
                .filter(u => u.status === 'RENTED')
                .reduce((sum, u) => sum + (u.monthlyRent || 0), 0);

        // Value appreciation
        const valueAppreciation = totalPurchaseValue > 0
            ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100
            : 0;

        // City distribution
        const cityDistribution: Record<string, number> = {};
        properties.forEach(p => {
            cityDistribution[p.city] = (cityDistribution[p.city] || 0) + 1;
        });

        // Recent transactions (last 5)
        const recentTransactions = await prisma.transaction.findMany({
            where: {
                property: propertyWhere
            },
            include: {
                property: {
                    select: { title: true }
                }
            },
            orderBy: { date: 'desc' },
            take: 5
        });

        // Monthly income trend (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrend = await prisma.transaction.groupBy({
            by: ['type'],
            where: {
                property: propertyWhere,
                date: { gte: sixMonthsAgo },
                type: { in: ['RENT_INCOME'] }
            },
            _sum: { amount: true }
        });

        return NextResponse.json({
            // Summary
            totalProperties,
            totalValue,
            totalPurchaseValue,
            valueAppreciation: Math.round(valueAppreciation * 100) / 100,

            // Status
            statusCounts,
            typeCounts,

            // Units
            totalUnits,
            rentedUnits,
            occupancyRate: Math.round(occupancyRate * 100) / 100,

            // Financial
            totalIncome,
            totalExpenses,
            netIncome: totalIncome - totalExpenses,
            monthlyRentPotential,
            actualMonthlyRent,

            // Distribution
            cityDistribution,

            // Recent activity
            recentTransactions: recentTransactions.map(t => ({
                id: t.id,
                type: t.type,
                amount: t.amount,
                date: t.date,
                description: t.description,
                propertyTitle: t.property?.title
            }))
        });

    } catch (error: any) {
        if (error?.message?.includes("Unauthorized")) {
            return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
        }
        console.error("GET portfolio stats error:", error);
        return NextResponse.json(
            { error: "İstatistikler yüklenemedi" },
            { status: 500 }
        );
    }
}
