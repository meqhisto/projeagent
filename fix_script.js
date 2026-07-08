const fs = require('fs');

const filePath = 'app/api/properties/stats/route.ts';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add unit potential rent query to Promise.all
content = content.replace(
    /prisma\.unit\.count\(\{ where: \{ property: propertyWhere, status: 'RENTED' \} \}\),/,
    `prisma.unit.count({ where: { property: propertyWhere, status: 'RENTED' } }),\n            prisma.unit.aggregate({ where: { property: propertyWhere }, _sum: { monthlyRent: true } })`
);

// 2. Destructure the result in the Promise.all assignment
content = content.replace(
    /rentedUnits,/,
    `rentedUnits,\n            totalUnitValueResult`
);

// 3. Fix the monthlyRentPotential calculation
content = content.replace(
    /const monthlyRentPotential = \(totalValueResult\._sum\.monthlyRent \|\| 0\);/,
    `const monthlyRentPotential = (totalValueResult._sum.monthlyRent || 0) + (totalUnitValueResult._sum.monthlyRent || 0);`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully fixed monthlyRentPotential calculation.');
