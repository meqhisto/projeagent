import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { requireAuth } from "@/lib/auth/roleCheck";
import { rateLimit, getRateLimitHeaders } from "@/lib/rateLimit";

const prisma = new PrismaClient();

export async function POST(req: Request) {
    // Rate limiting check
    const rateLimitResult = rateLimit(req, "/api/auth/change-password");

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." },
            {
                status: 429,
                headers: getRateLimitHeaders(rateLimitResult),
            }
        );
    }

    try {
        // Get authenticated user
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const body = await req.json();
        const { currentPassword, newPassword } = body;

        // Validation
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: "Mevcut şifre ve yeni şifre gereklidir" },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: "Yeni şifre en az 8 karakter olmalıdır" },
                { status: 400 }
            );
        }

        // Get user from database
        const dbUser = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!dbUser) {
            return NextResponse.json(
                { error: "Kullanıcı bulunamadı" },
                { status: 404 }
            );
        }

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, dbUser.password);

        if (!isValid) {
            return NextResponse.json(
                { error: "Mevcut şifre hatalı" },
                { status: 401 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword }
        });

        return NextResponse.json({
            success: true,
            message: "Şifreniz başarıyla güncellendi"
        });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json(
                { error: "Oturum açmanız gerekiyor" },
                { status: 401 }
            );
        }

        console.error("Password change error:", error);
        return NextResponse.json(
            { error: "Şifre güncellenirken bir hata oluştu" },
            { status: 500 }
        );
    }
}
export const runtime = 'nodejs';
