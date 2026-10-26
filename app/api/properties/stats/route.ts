import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

// GET - Portfolio statistics
export async function GET() {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        const userRole = (user as any).role; // eslint-disable-line @typescript-eslint/no-explicit-any

        // Build where clause based on role
        const propertyWhere = isAdmin(userRole) ? {} : { ownerId: userId };

        // ⚡ Bolt Optimization: Replaced large findMany() with concurrent database-level aggregations
        // to drastically reduce memory overhead and Node.js processing time.

        const thisYearStart = new Date(new Date().getFullYear(), 0, 1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
const incomeTypes: any[] = ['RENT_INCOME', 'SALE', 'DEPOSIT'];

        const [
            totalProperties,
            propertyAggregations,
            statusGroup,
            typeGroup,
            cityGroup,
            totalUnits,
            rentedUnits,
            unitRentPotentialAgg,
            rentedUnitRentAgg,
            incomeAgg,
            expenseAgg,
            recentTransactions
        ] = await Promise.all([
            // total properties
            prisma.property.count({ where: propertyWhere }),

            // property values
            prisma.property.aggregate({
                where: propertyWhere,
                _sum: { currentValue: true, purchasePrice: true, monthlyRent: true }
            }),

            // status counts
            prisma.property.groupBy({
                by: ['status'],
                where: propertyWhere,
                _count: { _all: true }
            }),

            // type counts
            prisma.property.groupBy({
                by: ['type'],
                where: propertyWhere,
                _count: { _all: true }
            }),

            // city distribution
            prisma.property.groupBy({
                by: ['city'],
                where: propertyWhere,
                _count: { _all: true }
            }),

            // total units
            prisma.unit.count({
                where: { property: propertyWhere }
            }),

            // rented units
            prisma.unit.count({
                where: { property: propertyWhere, status: 'RENTED' }
            }),

            // total unit monthly rent
            prisma.unit.aggregate({
                where: { property: propertyWhere },
                _sum: { monthlyRent: true }
            }),

            // rented unit monthly rent
            prisma.unit.aggregate({
                where: { property: propertyWhere, status: 'RENTED' },
                _sum: { monthlyRent: true }
            }),

            // total income this year
            prisma.transaction.aggregate({
                where: {
                    property: propertyWhere,
                    date: { gte: thisYearStart },
                    type: { in: incomeTypes }
                },
                _sum: { amount: true }
            }),

            // total expenses this year
            prisma.transaction.aggregate({
                where: {
                    property: propertyWhere,
                    date: { gte: thisYearStart },
                    type: { notIn: incomeTypes }
                },
                _sum: { amount: true }
            }),

            // recent transactions
            prisma.transaction.findMany({
                where: { property: propertyWhere },
                include: { property: { select: { title: true } } },
                orderBy: { date: 'desc' },
                take: 5
            })
        ]);

        const totalValue = propertyAggregations._sum.currentValue || 0;
        const totalPurchaseValue = propertyAggregations._sum.purchasePrice || 0;

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

        const typeCounts: Record<string, number> = {};
        typeGroup.forEach(g => {
            typeCounts[g.type] = g._count._all;
        });

        const cityDistribution: Record<string, number> = {};
        cityGroup.forEach(g => {
            cityDistribution[g.city] = g._count._all;
        });

        const occupancyRate = totalUnits > 0 ? (rentedUnits / totalUnits) * 100 : 0;

        const totalIncome = incomeAgg._sum?.amount || 0;
        const totalExpenses = expenseAgg._sum?.amount || 0;

        const propertyMonthlyRent = propertyAggregations._sum.monthlyRent || 0;
        const unitMonthlyRent = unitRentPotentialAgg._sum.monthlyRent || 0;
        const monthlyRentPotential = propertyMonthlyRent + unitMonthlyRent;

        const rentedPropertyRentAgg = await prisma.property.aggregate({
            where: { ...propertyWhere, status: 'RENTED' },
            _sum: { monthlyRent: true }
        });
        const actualMonthlyRent = (rentedPropertyRentAgg._sum.monthlyRent || 0) + (rentedUnitRentAgg._sum.monthlyRent || 0);

        const valueAppreciation = totalPurchaseValue > 0
            ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100
            : 0;

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

    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
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
