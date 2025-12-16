import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Manually load .env
const envPath = path.join(__dirname, "../.env"); // Adjusted path for prisma/seed.ts (parent dir)
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf-8");
    envConfig.split("\n").forEach((line) => {
        const [key, value] = line.split("=");
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/"/g, "");
        }
    });
}

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

    // Create custom user
    const customUser = await prisma.user.upsert({
        where: { email: "altanbariscomert@gmail.com" },
        update: {
            password: hashedPassword,
            role: "ADMIN",
            name: "Altan Baris Comert"
        },
        create: {
            email: "altanbariscomert@gmail.com",
            password: hashedPassword,
            name: "Altan Baris Comert",
            role: "ADMIN", // Assuming admin role as requested implies power user
        },
    });
    console.log(`✅ Custom user created: ${customUser.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
