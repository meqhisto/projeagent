import { prisma } from "./lib/prisma"

async function main() {
    try {
        console.log("Connecting to DB...");
        const count = await prisma.parcel.count();
        console.log("Successfully connected. Parcel count:", count);
    } catch (e) {
        console.error("DB Connection Failed:");
        console.error(e);
        process.exit(1);
    }
}

main();
