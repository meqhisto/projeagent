import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { rateLimit, getRateLimitHeaders } from "@/lib/rateLimit";
import { logLogin } from "@/lib/auditLog";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    // Rate limiting check
    const rateLimitResult = rateLimit(request, "/api/auth/verify");

    if (!rateLimitResult.success) {
        // Log rate limit event
        await logLogin(request, null, false);

        return NextResponse.json(
            { error: "Too many login attempts. Please try again later." },
            {
                status: 429,
                headers: getRateLimitHeaders(rateLimitResult),
            }
        );
    }

    try {
        const { email, password } = await request.json();

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Log failed login attempt
            await logLogin(request, null, false, email);

            return NextResponse.json(
                { error: "Invalid credentials" },
                {
                    status: 401,
                    headers: getRateLimitHeaders(rateLimitResult),
                }
            );
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            // Log failed login attempt  
            await logLogin(request, user.id, false, email);

            return NextResponse.json(
                { error: "Invalid credentials" },
                {
                    status: 401,
                    headers: getRateLimitHeaders(rateLimitResult),
                }
            );
        }

        // Log successful login
        await logLogin(request, user.id, true, email);

        return NextResponse.json({
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
        }, {
            headers: getRateLimitHeaders(rateLimitResult),
        });
    } catch (error) {
        console.error("Verify user error:", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}
export const runtime = 'nodejs';
