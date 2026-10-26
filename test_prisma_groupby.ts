import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
    const res = await prisma.property.groupBy({
        by: ['status'],
        _count: true
    });
    console.log(JSON.stringify(res, null, 2));
}

test().finally(() => prisma.$disconnect());
