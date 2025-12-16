import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        return NextResponse.json({
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role, // Add role to response
        });
    } catch (error) {
        console.error("Verify user error:", error);
        return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }
}
