import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/roleCheck";

// PATCH - Update task
export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await requireAuth();
        const body = await req.json();

        const {
            content,
            dueDate,
            priority,
            assignedTo,
            tags,
            isCompleted
        } = body;

        const updateData: any = {};

        if (content !== undefined) updateData.content = content;
        if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
        if (priority !== undefined) updateData.priority = priority;
        if (assignedTo !== undefined) updateData.assignedTo = assignedTo ? parseInt(assignedTo) : null;
        if (tags !== undefined) updateData.tags = tags;
        if (isCompleted !== undefined) updateData.isCompleted = isCompleted;

        const task = await prisma.interaction.update({
            where: { id: parseInt(params.id) },
            data: updateData,
            include: {
                parcel: true,
                customer: true,
                assignee: true,
                creator: true
            }
        });

        // Create notification if task completed (notify creator)
        if (isCompleted === true && task.createdBy && user.id && task.createdBy !== parseInt(user.id)) {
            await prisma.notification.create({
                data: {
                    type: "TASK_COMPLETED",
                    title: "Görev Tamamlandı",
                    message: `${user.name} "${task.content}" görevini tamamladı`,
                    relatedId: task.id,
                    relatedType: "TASK"
                }
            });
        }

        return NextResponse.json(task);

    } catch (error: any) {
        console.error("Update task error:", error);

        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(
            { error: "Failed to update task" },
            { status: 500 }
        );
    }
}

// DELETE - Delete task
export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        await requireAuth();

        await prisma.interaction.delete({
            where: { id: parseInt(params.id) }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Delete task error:", error);

        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(
            { error: "Failed to delete task" },
            { status: 500 }
        );
    }
}
