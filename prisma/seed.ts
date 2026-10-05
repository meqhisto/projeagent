import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // 1. Admin kullanıcı oluştur
    const adminEmail = 'altanbariscomert@gmail.com';
    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!seedPassword) {
        throw new Error('SEED_ADMIN_PASSWORD environment variable is required to seed the admin user');
    }
    const adminPassword = await bcrypt.hash(seedPassword, 10);

    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: adminPassword,
            name: 'Altan Baris Comert',
            role: 'ADMIN',
            isActive: true,
        },
    });

    console.log('✅ Admin user created:', admin.email);

    // 2. Demo parsel oluştur (opsiyonel)
    const demoParcel = await prisma.parcel.upsert({
        where: {
            ownerId_city_district_neighborhood_island_parsel: {
                ownerId: admin.id,
                city: 'İstanbul',
                district: 'Kadıköy',
                neighborhood: 'Fenerbahçe',
                island: '100',
                parsel: '5',
            },
        },
        update: {},
        create: {
            ownerId: admin.id,
            city: 'İstanbul',
            district: 'Kadıköy',
            neighborhood: 'Fenerbahçe',
            island: '100',
            parsel: '5',
            area: 500,
            latitude: 40.9833,
            longitude: 29.0333,
            status: 'PENDING',
            crmStage: 'NEW_LEAD',
        },
    });

    console.log('✅ Demo parcel created:', demoParcel.id);

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
