import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export const runtime = 'nodejs';

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

        // Get last 6 months
        const monthsData = [];
        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

        // Prepare month ranges for queries
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

            monthsData.push({
                month: monthNames[date.getMonth()],
                start: monthStart,
                end: monthEnd
            });
        }

        // ⚡ Bolt Optimization: Replace O(n) findMany + array processing with concurrent DB queries
        const counts = await Promise.all(
            monthsData.map(data =>
                prisma.parcel.count({
                    where: {
                        ...where,
                        createdAt: {
                            gte: data.start,
                            lte: data.end
                        }
                    }
                })
            )
        );

        const months = monthsData.map((data, index) => ({
            month: data.month,
            count: counts[index]
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
