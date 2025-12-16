import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - List notifications
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "10");
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        const notifications = await prisma.notification.findMany({
            where: unreadOnly ? { isRead: false } : undefined,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        const unreadCount = await prisma.notification.count({
            where: { isRead: false },
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error("GET notifications error:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

// POST - Create notification (internal)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, title, message, relatedId, relatedType } = body;

        if (!type || !title || !message) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const notification = await prisma.notification.create({
            data: {
                type,
                title,
                message,
                relatedId,
                relatedType,
            },
        });

        return NextResponse.json(notification, { status: 201 });
    } catch (error) {
        console.error("POST notification error:", error);
        return NextResponse.json(
            { error: "Failed to create notification" },
            { status: 500 }
        );
    }
}
