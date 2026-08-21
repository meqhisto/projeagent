import { prisma } from "./lib/prisma";

async function main() {
  const propertyWhere = {};

  const properties = await prisma.property.findMany({
      where: propertyWhere,
      select: {
          currentValue: true,
          purchasePrice: true,
          status: true,
          type: true,
          monthlyRent: true,
          city: true,
          units: {
              select: { status: true, monthlyRent: true }
          },
          transactions: {
              where: {
                  date: {
                      gte: new Date(new Date().getFullYear(), 0, 1) // This year
                  }
              },
              select: { type: true, amount: true }
          }
      }
  });

  const recentTransactions = await prisma.transaction.findMany({
      where: {
          property: propertyWhere
      },
      select: {
          id: true,
          type: true,
          amount: true,
          date: true,
          description: true,
          property: {
              select: { title: true }
          }
      },
      orderBy: { date: 'desc' },
      take: 5
  });
  console.log("Success");
}
