import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/roleCheck";

// GET - Task statistics
export async function GET(req: Request) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(req.url);
        const assignedTo = searchParams.get("assignedTo");

        const where: any = {
            type: "TASK"
        };

        if (assignedTo) {
            where.assignedTo = parseInt(assignedTo);
        }

        const [
            total,
            completed,
            pending,
            overdue,
            dueToday,
            dueThisWeek,
            byPriority
        ] = await Promise.all([
            // Total tasks
            prisma.interaction.count({ where }),

            // Completed tasks
            prisma.interaction.count({
                where: { ...where, isCompleted: true }
            }),

            // Pending tasks
            prisma.interaction.count({
                where: { ...where, isCompleted: false }
            }),

            // Overdue tasks
            prisma.interaction.count({
                where: {
                    ...where,
                    isCompleted: false,
                    dueDate: { lt: new Date() }
                }
            }),

            // Due today
            prisma.interaction.count({
                where: {
                    ...where,
                    isCompleted: false,
                    dueDate: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999))
                    }
                }
            }),

            // Due this week
            prisma.interaction.count({
                where: {
                    ...where,
                    isCompleted: false,
                    dueDate: {
                        gte: new Date(),
                        lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }
                }
            }),

            // By priority
            prisma.interaction.groupBy({
                by: ['priority'],
                where,
                _count: true
            })
        ]);

        const priorityStats = byPriority.reduce((acc: any, item) => {
            acc[item.priority || 'MEDIUM'] = item._count;
            return acc;
        }, {});

        return NextResponse.json({
            total,
            completed,
            pending,
            overdue,
            dueToday,
            dueThisWeek,
            byPriority: {
                LOW: priorityStats.LOW || 0,
                MEDIUM: priorityStats.MEDIUM || 0,
                HIGH: priorityStats.HIGH || 0,
                URGENT: priorityStats.URGENT || 0
            }
        });

    } catch (error: any) {
        console.error("Get task stats error:", error);

        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(
            { error: "Failed to fetch task statistics" },
            { status: 500 }
        );
    }
}
