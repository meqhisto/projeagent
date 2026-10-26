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

        // ⚡ Bolt Optimization: Use Promise.all and database aggregations
        // instead of finding all records into memory. This reduces DB memory bloat, network transfer, and NextJS memory load.
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);

        const [
            totalProperties,
            propertyAggregates,
            statusGroup,
            typeGroup,
            cityGroup,
            totalUnits,
            rentedUnits,
            unitAggregates,
            rentedUnitAggregates,
            transactionIncomeGroup,
            transactionExpenseGroup,
            rentedPropertyAggregates
        ] = await Promise.all([
            // Property counts
            prisma.property.count({ where: propertyWhere }),

            // Property value aggregations (sum of currentValue, purchasePrice, monthlyRent)
            prisma.property.aggregate({
                where: propertyWhere,
                _sum: {
                    currentValue: true,
                    purchasePrice: true,
                    monthlyRent: true,
                }
            }),

            // Property status counts
            prisma.property.groupBy({
                by: ['status'],
                where: propertyWhere,
                _count: { _all: true }
            }),

            // Property type counts
            prisma.property.groupBy({
                by: ['type'],
                where: propertyWhere,
                _count: { _all: true }
            }),

            // Property city distribution
            prisma.property.groupBy({
                by: ['city'],
                where: propertyWhere,
                _count: { _all: true }
            }),

            // Unit counts
            prisma.unit.count({
                where: { property: propertyWhere }
            }),

            // Rented unit counts
            prisma.unit.count({
                where: { property: propertyWhere, status: 'RENTED' }
            }),

            // Unit monthly rent aggregate
            prisma.unit.aggregate({
                where: { property: propertyWhere },
                _sum: { monthlyRent: true }
            }),

            // Rented unit monthly rent aggregate
            prisma.unit.aggregate({
                where: { property: propertyWhere, status: 'RENTED' },
                _sum: { monthlyRent: true }
            }),

            // Transaction incomes
            prisma.transaction.aggregate({
                where: {
                    property: propertyWhere,
                    date: { gte: startOfYear },
                    type: { in: ['RENT_INCOME', 'SALE', 'DEPOSIT'] }
                },
                _sum: { amount: true }
            }),

            // Transaction expenses
            prisma.transaction.aggregate({
                where: {
                    property: propertyWhere,
                    date: { gte: startOfYear },
                    type: { notIn: ['RENT_INCOME', 'SALE', 'DEPOSIT'] }
                },
                _sum: { amount: true }
            }),

            // Rented property monthly rent aggregate
            prisma.property.aggregate({
                where: { ...propertyWhere, status: 'RENTED' },
                _sum: { monthlyRent: true }
            }),

            // Rented property monthly rent aggregate
            prisma.property.aggregate({
                where: { ...propertyWhere, status: 'RENTED' },
                _sum: { monthlyRent: true }
            }),

            // Rented property monthly rent aggregate
            prisma.property.aggregate({
                where: { ...propertyWhere, status: 'RENTED' },
                _sum: { monthlyRent: true }
            })
        ]);

        const totalValue = propertyAggregates._sum.currentValue || 0;
        const totalPurchaseValue = propertyAggregates._sum.purchasePrice || 0;

        // Status counts map
        const statusCounts = {
            AVAILABLE: 0,
            RENTED: 0,
            SOLD: 0,
            UNDER_CONSTRUCTION: 0,
            RENOVATION: 0,
            RESERVED: 0
        };
        statusGroup.forEach(g => {
            if (statusCounts[g.status as keyof typeof statusCounts] !== undefined) {
                statusCounts[g.status as keyof typeof statusCounts] = g._count._all;
            }
        });

        // Type counts map
        const typeCounts: Record<string, number> = {};
        typeGroup.forEach(g => {
            typeCounts[g.type] = g._count._all;
        });

        // City distribution map
        const cityDistribution: Record<string, number> = {};
        cityGroup.forEach(g => {
            cityDistribution[g.city] = g._count._all;
        });

        const occupancyRate = totalUnits > 0 ? (rentedUnits / totalUnits) * 100 : 0;

        const totalIncome = transactionIncomeGroup._sum.amount || 0;
        const totalExpenses = transactionExpenseGroup._sum.amount || 0;

        const monthlyRentPotential = (propertyAggregates._sum.monthlyRent || 0) + (unitAggregates._sum.monthlyRent || 0);

        // For actualMonthlyRent, we need rented properties rent + rented units rent


        const actualMonthlyRent = (rentedPropertyAggregates._sum.monthlyRent || 0) + (rentedUnitAggregates._sum.monthlyRent || 0);

        // Value appreciation
        const valueAppreciation = totalPurchaseValue > 0
            ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100
            : 0;

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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _monthlyTrend = await prisma.transaction.groupBy({
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
