import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // ⚡ Bolt: Used shared singleton instead of instantiating new PrismaClient

import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";

export async function GET() {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        // Build query based on role
        const baseWhere = isAdmin((user as any).role as string)
            ? {} // Admin sees all
            : {
                OR: [
                    { ownerId: userId },
                    { assignedTo: userId }
                ]
            };


        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
        const monthQueries = [];
        const monthLabels = [];

        // Pre-calculate month ranges
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            monthLabels.push(monthNames[date.getMonth()]);

            // ⚡ Bolt: Pushing calculation to DB using count and concurrent promises
            monthQueries.push(
                prisma.parcel.count({
                    where: {
                        ...baseWhere,
                        createdAt: {
                            gte: monthStart,
                            lte: monthEnd,
                        }
                    }
                })
            );
        }

        // Execute all queries concurrently
        const counts = await Promise.all(monthQueries);

        const months = monthLabels.map((month, index) => ({
            month,
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
