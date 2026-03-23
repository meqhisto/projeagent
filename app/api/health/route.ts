import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        // Database connectivity check
        await prisma.$queryRaw`SELECT 1`;

        return NextResponse.json({
            status: "healthy",
            timestamp: new Date().toISOString(),
            service: "frontend",
            database: "connected"
        });
    } catch (error: any) {
        return NextResponse.json({
            status: "unhealthy",
            timestamp: new Date().toISOString(),
            service: "frontend",
            database: "disconnected",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        }, { status: 503 });
    }
}
