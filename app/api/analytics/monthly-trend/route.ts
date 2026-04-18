import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; //⚡ Bolt: Optimized by replacing new PrismaClient() with shared instance

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

        // ⚡ Bolt: Optimized by replacing `findMany` + JS array filtering with concurrent `count` queries
        // This avoids fetching potentially thousands of records into memory just to count them by date.
        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

        // Prepare month date ranges
        const monthRanges = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

            monthRanges.push({
                month: monthNames[date.getMonth()],
                start: monthStart,
                end: monthEnd
            });
        }

        // Execute all count queries concurrently
        const monthCounts = await Promise.all(
            monthRanges.map(range =>
                prisma.parcel.count({
                    where: {
                        ...where,
                        createdAt: {
                            gte: range.start,
                            lte: range.end
                        }
                    }
                })
            )
        );

        const months = monthRanges.map((range, index) => ({
            month: range.month,
            count: monthCounts[index]
        }));

        return NextResponse.json(months);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Monthly trend error:", error);
        return NextResponse.json({ error: "Failed to fetch monthly trend" }, { status: 500 });
    }
}
