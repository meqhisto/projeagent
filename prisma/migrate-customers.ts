/**
 * Data Migration Script: Assign Existing Customers to Admin
 * 
 * This script assigns all existing customers without an owner to the admin user.
 * Run this after adding the ownerId field to the Customer model.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCustomers() {
    try {
        console.log('🔄 Starting customer data migration...\n');

        // 1. Find admin user
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });

        if (!adminUser) {
            console.error('❌ No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        console.log(`✅ Found admin user: ${adminUser.email} (ID: ${adminUser.id})\n`);

        // 2. Count customers without owner
        const orphanedCustomers = await prisma.customer.count({
            where: { ownerId: null as any }
        });

        console.log(`📊 Found ${orphanedCustomers} customers without owner\n`);

        if (orphanedCustomers === 0) {
            console.log('✨ All customers already have an owner. Migration complete!');
            return;
        }

        // 3. Update customers to assign to admin
        const result = await prisma.customer.updateMany({
            where: { ownerId: null as any },
            data: { ownerId: adminUser.id }
        });

        console.log(`✅ Successfully assigned ${result.count} customers to admin user\n`);

        // 4. Verify migration
        const remainingOrphans = await prisma.customer.count({
            where: { ownerId: null as any }
        });

        if (remainingOrphans === 0) {
            console.log('✨ Migration completed successfully! All customers now have an owner.');
        } else {
            console.warn(`⚠️  Warning: ${remainingOrphans} customers still without owner`);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run migration
migrateCustomers();
