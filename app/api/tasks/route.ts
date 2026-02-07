import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { requireAuth } from "@/lib/auth/roleCheck";
import { logger } from "@/lib/logger";
import { INTERACTION_TYPE, ROLES, PRIORITY, NOTIFICATION_TYPE } from "@/lib/constants";

// GET - List tasks with filters
export async function GET(req: Request) {
    try {
        const user = await requireAuth();
        const { searchParams } = new URL(req.url);

        // Filters
        const assignedTo = searchParams.get("assignedTo");
        const status = searchParams.get("status");
        const priority = searchParams.get("priority");
        const overdue = searchParams.get("overdue");
        const dueToday = searchParams.get("dueToday");
        const dueThisWeek = searchParams.get("dueThisWeek");

        const where: Prisma.InteractionWhereInput = {
            type: INTERACTION_TYPE.TASK
        };

        // User based filtering (Secure default)
        // If not admin, user can only see tasks assigned to them OR created by them
        if (user.role !== ROLES.ADMIN) {
            where.OR = [
                { assignedTo: parseInt(user.id || "0") },
                { createdBy: parseInt(user.id || "0") }
            ];
        }

        // Filter by assigned user (Admin can filter by specific user)
        if (assignedTo) {
            // If regular user tries to filter by someone else, ignore it or enforce their own id if unrelated
            // But usually the UI won't show the option. 
            // We'll trust the OR condition above to handle security.
            // If we add this AND the OR from above, it works as intersection.
            where.assignedTo = parseInt(assignedTo);
        }

        // Filter by completion status
        if (status === "completed") {
            where.isCompleted = true;
        } else if (status === "pending") {
            where.isCompleted = false;
        }

        // Filter by priority
        if (priority) {
            where.priority = priority;
        }

        // Filter overdue tasks
        if (overdue === "true") {
            where.dueDate = { lt: new Date() };
            where.isCompleted = false;
        }

        // Filter due today
        if (dueToday === "true") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            where.dueDate = {
                gte: today,
                lt: tomorrow
            };
        }

        // Filter due this week
        if (dueThisWeek === "true") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextWeek = new Date(today);
            nextWeek.setDate(nextWeek.getDate() + 7);

            where.dueDate = {
                gte: today,
                lt: nextWeek
            };
        }

        const tasks = await prisma.interaction.findMany({
            where,
            include: {
                parcel: {
                    select: {
                        id: true,
                        city: true,
                        district: true,
                        island: true,
                        parsel: true
                    }
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                        role: true
                    }
                },
                assignee: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                creator: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: [
                { isCompleted: 'asc' },
                { dueDate: 'asc' }
            ]
        });

        return NextResponse.json(tasks);

    } catch (error: any) {
        logger.error("Get tasks error:", error);

        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(
            { error: "Failed to fetch tasks" },
            { status: 500 }
        );
    }
}

// POST - Create new task
export async function POST(req: Request) {
    try {
        const user = await requireAuth();
        const body = await req.json();

        const {
            parcelId,
            customerId,
            content,
            dueDate,
            priority = PRIORITY.MEDIUM,
            assignedTo,
            tags
        } = body;

        // Validation
        if (!parcelId || !content) {
            return NextResponse.json(
                { error: "parcelId and content are required" },
                { status: 400 }
            );
        }

        const task = await prisma.interaction.create({
            data: {
                parcelId: parseInt(parcelId),
                customerId: customerId ? parseInt(customerId) : null,
                type: INTERACTION_TYPE.TASK,
                content,
                dueDate: dueDate ? new Date(dueDate) : null,
                priority,
                assignedTo: assignedTo ? parseInt(assignedTo) : null,
                createdBy: user.id ? parseInt(user.id) : null,
                tags,
                isCompleted: false
            },
            include: {
                parcel: true,
                customer: true,
                assignee: true,
                creator: true
            }
        });

        // Create notification if assigned to someone
        if (assignedTo && assignedTo !== user.id) {
            await prisma.notification.create({
                data: {
                    type: NOTIFICATION_TYPE.TASK_ASSIGNED,
                    title: "Yeni Görev Atandı",
                    message: `${user.name} size "${content}" görevini atadı`,
                    relatedId: task.id,
                    relatedType: INTERACTION_TYPE.TASK
                }
            });
        }

        return NextResponse.json(task);

    } catch (error: any) {
        logger.error("Create task error:", error);

        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(
            { error: "Failed to create task" },
            { status: 500 }
        );
    }
}
