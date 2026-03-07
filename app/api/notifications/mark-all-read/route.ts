import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PATCH - Mark all notifications as read
export async function PATCH() {
    try {
        await prisma.notification.updateMany({
            where: { isRead: false },
            data: { isRead: true },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Mark all read error:", error);
        return NextResponse.json(
            { error: "Failed to mark all as read" },
            { status: 500 }
        );
    }
}
export const runtime = 'nodejs';
