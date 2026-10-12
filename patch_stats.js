const fs = require('fs');
const path = './app/api/properties/stats/route.ts';
let content = fs.readFileSync(path, 'utf8');

// The file was reset. Re-applying the fix.
const newLogic = `        // Fetch properties, recent transactions, and monthly trend concurrently
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const [properties, recentTransactions, monthlyTrend] = await Promise.all([
            prisma.property.findMany({
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
            }),
            prisma.transaction.findMany({
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
        ]);`;

const oldLogic1 = `        // Get all properties with related data
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
        });`;

const oldLogic2 = `        // Recent transactions (last 5)
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
        });`;

const oldLogic3 = `        // Monthly income trend (last 6 months)
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
        });`;

if (content.includes(oldLogic1) && content.includes(oldLogic2) && content.includes(oldLogic3)) {
    content = content.replace(oldLogic1, newLogic);
    content = content.replace(oldLogic2, `        // Recent transactions (last 5) already fetched concurrently`);
    content = content.replace(oldLogic3, `        // Monthly income trend (last 6 months) already fetched concurrently`);
    fs.writeFileSync(path, content);
    console.log('Successfully patched property stats route to use Promise.all for all 3 queries');
} else {
    console.error('Failed to find matching code block to patch.');
}
