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

        // ⚡ BOLT OPTIMIZATION: Push data filtering and aggregation to DB
        // using concurrent counts instead of loading all parcels into memory
        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

        // Prepare date ranges for the last 6 months
        const dateRanges = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            dateRanges.push({
                monthIndex: date.getMonth(),
                monthStart,
                monthEnd
            });
        }

        // Execute concurrent queries using Promise.all
        const counts = await Promise.all(
            dateRanges.map(range =>
                prisma.parcel.count({
                    where: {
                        ...where,
                        createdAt: {
                            gte: range.monthStart,
                            lte: range.monthEnd
                        }
                    }
                })
            )
        );

        // Map results back to expected format
        const months = dateRanges.map((range, index) => ({
            month: monthNames[range.monthIndex],
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
