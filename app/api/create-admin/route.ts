import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";



export async function POST() {
    try {
        // Check if admin already exists
        const existing = await prisma.user.findUnique({
            where: { email: "admin@parselmonitor.com" },
        });

        if (existing) {
            return NextResponse.json({ message: "Admin user already exists" }, { status: 200 });
        }

        // Create admin user
        const hashedPassword = await bcrypt.hash("admin123", 10);

        const adminUser = await prisma.user.create({
            data: {
                email: "admin@parselmonitor.com",
                password: hashedPassword,
                name: "Admin User",
                role: "ADMIN",
            },
        });

        return NextResponse.json({
            message: "Admin user created successfully",
            email: adminUser.email,
        }, { status: 201 });
    } catch (error) {
        console.error("Create admin error:", error);
        return NextResponse.json(
            { error: "Failed to create admin user" },
            { status: 500 }
        );
    }
}
