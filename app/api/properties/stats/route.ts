import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";
import { TransactionType } from "@prisma/client";

// GET - Portfolio statistics
export async function GET() {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userRole = (user as any).role;

        // Build where clause based on role
        const propertyWhere = isAdmin(userRole) ? {} : { ownerId: userId };
        const unitWhere = { property: propertyWhere };
        const transactionWhere = {
            property: propertyWhere,
            date: {
                gte: new Date(new Date().getFullYear(), 0, 1) // This year
            }
        };

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // Calculate statistics using database aggregations concurrently
        const [
            totalProperties,
            propertyAggregates,
            statusGroups,
            typeGroups,
            cityGroups,
            totalUnits,
            rentedUnits,
            propertyRentPotential,
            unitRentPotential,
            rentedPropertyActual,
            rentedUnitActual,
            incomeTransactions,
            expenseTransactions,
            recentTransactions,
            monthlyTrend
        ] = await Promise.all([
            prisma.property.count({ where: propertyWhere }),
            prisma.property.aggregate({
                where: propertyWhere,
                _sum: {
                    currentValue: true,
                    purchasePrice: true,
                }
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
            prisma.unit.count({ where: unitWhere }),
            prisma.unit.count({ where: { ...unitWhere, status: 'RENTED' } }),
            prisma.property.aggregate({
                where: propertyWhere,
                _sum: { monthlyRent: true }
            }),
            prisma.unit.aggregate({
                where: unitWhere,
                _sum: { monthlyRent: true }
            }),
            prisma.property.aggregate({
                where: { ...propertyWhere, status: 'RENTED' },
                _sum: { monthlyRent: true }
            }),
            prisma.unit.aggregate({
                where: { ...unitWhere, status: 'RENTED' },
                _sum: { monthlyRent: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    ...transactionWhere,
                    type: { in: ['RENT_INCOME', 'SALE', 'DEPOSIT'] as TransactionType[] }
                },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    ...transactionWhere,
                    type: { notIn: ['RENT_INCOME', 'SALE', 'DEPOSIT'] as TransactionType[] }
                },
                _sum: { amount: true }
            }),
            prisma.transaction.findMany({
                where: { property: propertyWhere },
                include: {
                    property: { select: { title: true } }
                },
                orderBy: { date: 'desc' },
                take: 5
            }),
            prisma.transaction.groupBy({
                by: ['type'],
                where: {
                    property: propertyWhere,
                    date: { gte: sixMonthsAgo },
                    type: { in: ['RENT_INCOME'] as TransactionType[] }
                },
                _sum: { amount: true }
            })
        ]);

        const totalValue = propertyAggregates._sum.currentValue || 0;
        const totalPurchaseValue = propertyAggregates._sum.purchasePrice || 0;

        // Status counts
        const statusCounts = {
            AVAILABLE: 0,
            RENTED: 0,
            SOLD: 0,
            UNDER_CONSTRUCTION: 0,
            RENOVATION: 0,
            RESERVED: 0
        };
        statusGroups.forEach(group => {
            if (statusCounts[group.status as keyof typeof statusCounts] !== undefined) {
                statusCounts[group.status as keyof typeof statusCounts] = group._count._all;
            }
        });

        // Type counts
        const typeCounts: Record<string, number> = {};
        typeGroups.forEach(group => {
            typeCounts[group.type] = group._count._all;
        });

        // Unit statistics
        const occupancyRate = totalUnits > 0 ? (rentedUnits / totalUnits) * 100 : 0;

        // Financial calculations
        const totalIncome = incomeTransactions._sum.amount || 0;
        const totalExpenses = expenseTransactions._sum.amount || 0;

        // Monthly rent potential
        const monthlyRentPotential = (propertyRentPotential._sum.monthlyRent || 0) + (unitRentPotential._sum.monthlyRent || 0);

        // Actual monthly rent (from rented properties/units)
        const actualMonthlyRent = (rentedPropertyActual._sum.monthlyRent || 0) + (rentedUnitActual._sum.monthlyRent || 0);

        // Value appreciation
        const valueAppreciation = totalPurchaseValue > 0
            ? ((totalValue - totalPurchaseValue) / totalPurchaseValue) * 100
            : 0;

        // City distribution
        const cityDistribution: Record<string, number> = {};
        cityGroups.forEach(group => {
            if (group.city) {
                cityDistribution[group.city] = group._count._all;
            }
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
            })),

            monthlyTrend
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
