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

        const sixMonthsAgoDate = new Date();
        sixMonthsAgoDate.setMonth(sixMonthsAgoDate.getMonth() - 5);
        const sixMonthsAgoStart = new Date(sixMonthsAgoDate.getFullYear(), sixMonthsAgoDate.getMonth(), 1);

        // ⚡ Bolt Optimization: Removed findMany() that fetched all records and full objects into memory.
        // Selecting only the `createdAt` field and limiting the query to the last 6 months drastically reduces payload and processing.
        const parcels = await prisma.parcel.findMany({
            where: {
                ...where,
                createdAt: { gte: sixMonthsAgoStart }
            },
            select: { createdAt: true }
        });

        // Get last 6 months
        const months = [];
        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const count = parcels.filter(p => {
                const createdAt = new Date(p.createdAt);
                return createdAt >= monthStart && createdAt <= monthEnd;
            }).length;

            months.push({
                month: monthNames[date.getMonth()],
                count
            });
        }

        return NextResponse.json(months);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Monthly trend error:", error);
        return NextResponse.json({ error: "Failed to fetch monthly trend" }, { status: 500 });
    }
}
