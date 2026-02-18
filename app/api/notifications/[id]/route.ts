import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PATCH - Mark single notification as read
export async function PATCH(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const body = await request.json();
        const { isRead } = body;

        const notification = await prisma.notification.update({
            where: { id: parseInt(params.id) },
            data: { isRead },
        });

        return NextResponse.json(notification);
    } catch (error) {
        console.error("PATCH notification error:", error);
        return NextResponse.json(
            { error: "Failed to update notification" },
            { status: 500 }
        );
    }
}
export const runtime = 'nodejs';
