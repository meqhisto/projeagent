import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export async function GET() {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        // Build query based on role
        const where = isAdmin((user as any).role as string)
            ? {} // Admin sees all
            : {
                OR: [
                    { ownerId: userId },
                    { assignedTo: userId }
                ]
            };

        // ⚡ Bolt Optimization: Use Prisma group by on formatted date (if supported directly, or fetch counts incrementally)
        // Given SQLite/Postgres differences, doing 6 small targeted counts is faster and uses less memory
        // than fetching thousands of rows to memory and filtering them.

        const months = [];
        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

        // Create array of promises for concurrent fetching
        const countPromises = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

            const monthStr = monthNames[date.getMonth()];

            countPromises.push(
                prisma.parcel.count({
                    where: {
                        ...where,
                        createdAt: {
                            gte: monthStart,
                            lte: monthEnd
                        }
                    }
                }).then(count => ({
                    month: monthStr,
                    count
                }))
            );
        }

        const results = await Promise.all(countPromises);

        return NextResponse.json(results);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Monthly trend error:", error);
        return NextResponse.json({ error: "Failed to fetch monthly trend" }, { status: 500 });
    }
}
