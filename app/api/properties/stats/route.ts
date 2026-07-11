import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

// GET - Portfolio statistics
export async function GET() {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userRole = (user as any).role;

        // Build where clause based on role
        const propertyWhere = isAdmin(userRole) ? {} : { ownerId: userId };

        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // ⚡ Bolt Optimization: Removed findMany() with includes that overfetched properties, units, and transactions.
        // Replaced with database-level aggregations using Promise.all to reduce memory bloat and transfer payload.
        const [
            totalProperties,
            propertiesAgg,
            statusGroup,
            typeGroup,
            cityGroup,
            totalUnits,
            rentedUnits,
            unitRentAgg,
            rentedUnitRentAgg,
            transactionsGroup,
            rentedPropertiesAgg,
            recentTransactions,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _monthlyTrend
        ] = await Promise.all([
            prisma.property.count({ where: propertyWhere }),
            prisma.property.aggregate({
                where: propertyWhere,
                _sum: { currentValue: true, purchasePrice: true, monthlyRent: true }
            }),
            prisma.property.groupBy({
                by: ['status'],
                where: propertyWhere,
                _count: { _all: true }
            }),
            prisma.property.groupBy({
                by: ['type'],
                where: propertyWhere,
                _count: { _all: true }
            }),
            prisma.property.groupBy({
                by: ['city'],
                where: propertyWhere,
                _count: { _all: true }
            }),
            prisma.unit.count({
                where: { property: propertyWhere }
            }),
            prisma.unit.count({
                where: { property: propertyWhere, status: 'RENTED' }
            }),
            prisma.unit.aggregate({
                where: { property: propertyWhere },
                _sum: { monthlyRent: true }
            }),
            prisma.unit.aggregate({
                where: { property: propertyWhere, status: 'RENTED' },
                _sum: { monthlyRent: true }
            }),
            prisma.transaction.groupBy({
                by: ['type'],
                where: {
                    property: propertyWhere,
                    date: { gte: startOfYear }
                },
                _sum: { amount: true }
            }),
            prisma.property.aggregate({
                where: { ...propertyWhere, status: 'RENTED' },
                _sum: { monthlyRent: true }
            }),
            prisma.transaction.findMany({
                where: { property: propertyWhere },
                include: { property: { select: { title: true } } },
                orderBy: { date: 'desc' },
                take: 5
            }),
            prisma.transaction.groupBy({
                by: ['type'],
                where: {
                    property: propertyWhere,
                    date: { gte: sixMonthsAgo },
                    type: { in: ['RENT_INCOME'] }
                },
                _sum: { amount: true }
            })
        ]);

        const totalValue = propertiesAgg._sum.currentValue || 0;
        const totalPurchaseValue = propertiesAgg._sum.purchasePrice || 0;

        // Status counts
        const statusCounts = {
            AVAILABLE: 0,
            RENTED: 0,
            SOLD: 0,
            UNDER_CONSTRUCTION: 0,
            RENOVATION: 0,
            RESERVED: 0
        };
        statusGroup.forEach(g => {
            const statusStr = g.status as keyof typeof statusCounts;
            if (statusCounts[statusStr] !== undefined) {
                statusCounts[statusStr] = g._count._all;
            }
        });

        // Type counts
        const typeCounts: Record<string, number> = {};
        typeGroup.forEach(g => {
            if (g.type) {
                typeCounts[g.type] = g._count._all;
            }
        });

        // City distribution
        const cityDistribution: Record<string, number> = {};
        cityGroup.forEach(g => {
            if (g.city) {
                cityDistribution[g.city] = g._count._all;
            }
        });

        const occupancyRate = totalUnits > 0 ? (rentedUnits / totalUnits) * 100 : 0;

        // Financial calculations
        const incomeTypes = ['RENT_INCOME', 'SALE', 'DEPOSIT'];

        let totalIncome = 0;
        let totalExpenses = 0;

        transactionsGroup.forEach(g => {
            const amount = g._sum.amount || 0;
            if (incomeTypes.includes(g.type)) {
                totalIncome += amount;
            } else {
                totalExpenses += amount;
            }
        });

        // Monthly rent potential
        const monthlyRentPotential = (propertiesAgg._sum.monthlyRent || 0) + (unitRentAgg._sum.monthlyRent || 0);

        // Actual monthly rent (from rented properties/units)
        const actualMonthlyRent = (rentedPropertiesAgg._sum.monthlyRent || 0) + (rentedUnitRentAgg._sum.monthlyRent || 0);

        // Value appreciation
        const valueAppreciation = totalPurchaseValue > 0
            ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100
            : 0;

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
