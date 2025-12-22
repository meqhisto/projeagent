import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/roleCheck";

// GET - List notifications for current user
export async function GET(request: Request) {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get("limit") || "10");
        const unreadOnly = searchParams.get("unreadOnly") === "true";

        // Filter by userId - user only sees their own notifications
        // Also include global notifications (userId is null) for backwards compatibility
        const whereClause: any = {
            OR: [
                { userId: userId },
                { userId: null } // Global notifications
            ]
        };

        if (unreadOnly) {
            whereClause.isRead = false;
        }

        const notifications = await prisma.notification.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            take: limit,
        });

        const unreadCount = await prisma.notification.count({
            where: {
                OR: [
                    { userId: userId },
                    { userId: null }
                ],
                isRead: false,
            },
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("GET notifications error:", error);
        return NextResponse.json(
            { error: "Failed to fetch notifications" },
            { status: 500 }
        );
    }
}

// POST - Create notification (internal use - for task assignments, etc.)
export async function POST(request: Request) {
    try {
        const user = await requireAuth();

        const body = await request.json();
        const { type, title, message, relatedId, relatedType, targetUserId } = body;

        if (!type || !title || !message) {
            return NextResponse.json(
                { error: "Missing required fields: type, title, message" },
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
                userId: targetUserId || null, // If no target, it's a global notification
            },
        });

        return NextResponse.json(notification, { status: 201 });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("POST notification error:", error);
        return NextResponse.json(
            { error: "Failed to create notification" },
            { status: 500 }
        );
    }
}
