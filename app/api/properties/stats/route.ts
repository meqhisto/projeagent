import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";
import type { TransactionType } from "@prisma/client";

// GET - Portfolio statistics
export async function GET() {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userRole = (user as any).role;

        // Build where clause based on role
        const propertyWhere = isAdmin(userRole) ? {} : { ownerId: userId };

        // Get aggregated properties data
        // ⚡ Bolt Optimization: Replace findMany() that fetched all records and relations into memory
        // with database-level aggregations via Promise.all. This drastically reduces Node.js memory bloat
        // and network payload size.

        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const incomeTypes: TransactionType[] = ['RENT_INCOME', 'SALE', 'DEPOSIT'];

        const [
            totalProperties,
            propertyAggregates,
            statusGroup,
            typeGroup,
            cityGroup,
            unitCount,
            rentedUnitCount,
            unitRentAggregates,
            rentedUnitRentAggregates,
            incomeAggregates,
            expenseAggregates,
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
            prisma.transaction.aggregate({
                where: { property: propertyWhere, date: { gte: startOfYear }, type: { in: incomeTypes } },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: { property: propertyWhere, date: { gte: startOfYear }, type: { notIn: incomeTypes } },
                _sum: { amount: true }
            })
        ]);

        const totalValue = propertyAggregates._sum.currentValue || 0;
        const totalPurchaseValue = propertyAggregates._sum.purchasePrice || 0;

        const statusCounts = {
            AVAILABLE: 0,
            RENTED: 0,
            SOLD: 0,
            UNDER_CONSTRUCTION: 0,
            RENOVATION: 0,
            RESERVED: 0
        };
        statusGroup.forEach(group => {
            if (statusCounts[group.status as keyof typeof statusCounts] !== undefined) {
                statusCounts[group.status as keyof typeof statusCounts] = group._count;
            }
        });

        const typeCounts: Record<string, number> = {};
        typeGroup.forEach(group => {
            typeCounts[group.type] = group._count;
        });

        const totalUnits = unitCount;
        const rentedUnits = rentedUnitCount;
        const occupancyRate = totalUnits > 0 ? (rentedUnits / totalUnits) * 100 : 0;

        const totalIncome = incomeAggregates._sum?.amount || 0;
        const totalExpenses = expenseAggregates._sum?.amount || 0;

        const propertyRentPotential = propertyAggregates._sum.monthlyRent || 0;
        const unitRentPotential = unitRentAggregates._sum.monthlyRent || 0;
        const monthlyRentPotential = propertyRentPotential + unitRentPotential;

        // Need property actual rent specific aggregation
        const propertyRentedAggregates = await prisma.property.aggregate({
             where: { ...propertyWhere, status: 'RENTED' },
             _sum: { monthlyRent: true }
        });
        const propertyActualRent = propertyRentedAggregates._sum.monthlyRent || 0;
        const unitActualRent = rentedUnitRentAggregates._sum.monthlyRent || 0;
        const actualMonthlyRent = propertyActualRent + unitActualRent;

        const valueAppreciation = totalPurchaseValue > 0
            ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100
            : 0;

        const cityDistribution: Record<string, number> = {};
        cityGroup.forEach(group => {
            cityDistribution[group.city] = group._count;
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
