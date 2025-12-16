import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = await prisma.user.upsert({
        where: { email: "admin@parselmonitor.com" },
        update: {},
        create: {
            email: "admin@parselmonitor.com",
            password: hashedPassword,
            name: "Admin User",
            role: "ADMIN",
        },
    });

    console.log(`✅ Admin user created: ${adminUser.email}`);
    console.log(`   Default password: admin123`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
