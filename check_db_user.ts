import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

// Manually load .env
const envPath = path.join(__dirname, ".env");
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
    console.log("Checking user altanbariscomert@gmail.com...");
    const user = await prisma.user.findUnique({
        where: { email: "altanbariscomert@gmail.com" },
    });

    if (user) {
        console.log("✅ User found in DB");
        console.log("   ID:", user.id);
        console.log("   Role:", user.role);
        console.log("   Password Hash:", user.password.substring(0, 10) + "...");

        const isMatch = await bcrypt.compare("admin123", user.password);
        console.log("   Password 'admin123' matches:", isMatch);
    } else {
        console.log("❌ User NOT found in DB");
    }
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
