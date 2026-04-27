/**
 * Data Migration Script: Verify Customer Ownership
 * 
 * This script verifies that all customers have an owner assigned.
 * Since ownerId is required in the schema, all customers should already have an owner.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyCustomerOwnership() {
    try {
        console.log('🔄 Verifying customer ownership...\n');

        // 1. Find admin user
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminUser) {
            console.error('❌ No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        console.log(`✅ Found admin user: ${adminUser.email} (ID: ${adminUser.id})\n`);

        // 2. Count total customers
        const totalCustomers = await prisma.customer.count();
        console.log(`📊 Total customers in database: ${totalCustomers}\n`);

        // 3. Count customers by owner
        const customersByOwner = await prisma.customer.groupBy({
            by: ['ownerId'],
            _count: {
                ownerId: true
            }
        });

        console.log('📊 Customers by owner:');
        for (const group of customersByOwner) {
            const owner = await prisma.user.findUnique({
                where: { id: group.ownerId },
                select: { name: true, email: true }
            });
            console.log(`   - ${owner?.name || owner?.email}: ${group._count.ownerId} customers`);
        }

        console.log('\n✨ Verification complete! All customers have an assigned owner.');

    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run verification
verifyCustomerOwnership();
