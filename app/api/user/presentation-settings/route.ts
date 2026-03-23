import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/roleCheck";

// GET - Kullanıcının sunum ayarlarını getir
export async function GET() {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const settings = await prisma.userPresentationSettings.findUnique({
            where: { userId }
        });

        // Eğer ayar yoksa varsayılan değerlerle döndür
        if (!settings) {
            return NextResponse.json({
                companyName: user.name || "",
                logoUrl: null,
                phone: "",
                email: user.email || "",
                address: "",
                website: ""
            });
        }

        return NextResponse.json(settings);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("GET presentation settings error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// PUT - Kullanıcının sunum ayarlarını güncelle
export async function PUT(request: NextRequest) {
    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const body = await request.json();
        const { companyName, logoUrl, phone, email, address, website } = body;

        const settings = await prisma.userPresentationSettings.upsert({
            where: { userId },
            update: {
                companyName,
                logoUrl,
                phone,
                email,
                address,
                website
            },
            create: {
                userId,
                companyName,
                logoUrl,
                phone,
                email,
                address,
                website
            }
        });

        return NextResponse.json(settings);
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("PUT presentation settings error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
