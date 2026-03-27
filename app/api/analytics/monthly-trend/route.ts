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

        // ⚡ Bolt Optimization:
        // Use concurrent `prisma.parcel.count()` queries for each month
        // to prevent transferring the entire DB table into Node.js for memory-based filtering.
        // Get last 6 months date ranges
        const monthRanges = [];
        const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            monthRanges.push({
                name: monthNames[date.getMonth()],
                start: monthStart,
                end: monthEnd
            });
        }

        // Execute queries concurrently
        const counts = await Promise.all(
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
            month: range.name,
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
