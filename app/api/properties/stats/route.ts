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

        // ⚡ Bolt Optimization: Replaced large findMany() with concurrent database aggregations.
        // Instead of fetching all properties, units, and transactions into memory, we use Prisma's groupBy, count, and aggregate.

        // Ensure TS typings map appropriately to initialize without errors
        const incomeTypes = ['RENT_INCOME', 'SALE', 'DEPOSIT'];

        const [
            totalProperties,
            totalValueResult,
            statusGrouped,
            typeGrouped,
            cityGrouped,
            totalUnits,
            rentedUnits,
            totalUnitValueResult
        ] = await Promise.all([
            prisma.property.count({ where: propertyWhere }),
            prisma.property.aggregate({
                where: propertyWhere,
                _sum: { currentValue: true, purchasePrice: true, monthlyRent: true }
            }),
            prisma.property.groupBy({
                by: ['status'],
                where: propertyWhere,
                _count: true
            }),
            prisma.property.groupBy({
                by: ['type'],
                where: propertyWhere,
                _count: true
            }),
            prisma.property.groupBy({
                by: ['city'],
                where: propertyWhere,
                _count: true
            }),
            prisma.unit.count({ where: { property: propertyWhere } }),
            prisma.unit.count({ where: { property: propertyWhere, status: 'RENTED' } }),
            prisma.unit.aggregate({ where: { property: propertyWhere }, _sum: { monthlyRent: true } })
        ]);

        const [
            totalTransactionsResult,
            actualRentResult,
            actualRentUnitResult
        ] = await Promise.all([
            prisma.transaction.groupBy({
                by: ['type'],
                where: {
                    property: propertyWhere,
                    date: { gte: new Date(new Date().getFullYear(), 0, 1) } // This year
                },
                _sum: { amount: true }
            }),
            prisma.property.aggregate({
                where: { ...propertyWhere, status: 'RENTED' },
                _sum: { monthlyRent: true }
            }),
            prisma.unit.aggregate({
                where: { property: propertyWhere, status: 'RENTED' },
                _sum: { monthlyRent: true }
            })
        ]);

        const totalValue = totalValueResult._sum.currentValue || 0;
        const totalPurchaseValue = totalValueResult._sum.purchasePrice || 0;

        // Status counts
        const statusCounts = {
            AVAILABLE: 0,
            RENTED: 0,
            SOLD: 0,
            UNDER_CONSTRUCTION: 0,
            RENOVATION: 0,
            RESERVED: 0
        };
        statusGrouped.forEach(item => {
            if (statusCounts[item.status as keyof typeof statusCounts] !== undefined) {
                statusCounts[item.status as keyof typeof statusCounts] = item._count || 0;
            }
        });

        // Type counts
        const typeCounts: Record<string, number> = {};
        typeGrouped.forEach(item => {
            typeCounts[item.type] = item._count || 0;
        });

        // Unit statistics
        const occupancyRate = totalUnits > 0 ? (rentedUnits / totalUnits) * 100 : 0;

        // Financial calculations
        const totalIncome = totalTransactionsResult
            .filter(t => incomeTypes.includes(t.type))
            .reduce((sum, t) => sum + (t._sum.amount || 0), 0);

        const totalExpenses = totalTransactionsResult
            .filter(t => !incomeTypes.includes(t.type))
            .reduce((sum, t) => sum + (t._sum.amount || 0), 0);

        // Monthly rent potential
        const monthlyRentPotential = (totalValueResult._sum.monthlyRent || 0) + (totalUnitValueResult._sum.monthlyRent || 0);

        // Actual monthly rent (from rented properties/units)
        const actualMonthlyRent = (actualRentResult._sum.monthlyRent || 0) + (actualRentUnitResult._sum.monthlyRent || 0);

        // Value appreciation
        const valueAppreciation = totalPurchaseValue > 0
            ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100
            : 0;

        // City distribution
        const cityDistribution: Record<string, number> = {};
        cityGrouped.forEach(item => {
            cityDistribution[item.city] = item._count || 0;
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

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
