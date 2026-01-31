import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";
import puppeteer from "puppeteer";
import crypto from "crypto";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const { id } = await props.params;
    let shareLinkId: number | null = null;

    try {
        const user = await requireAuth();
        const userId = parseInt(user.id || "0");

        const parcelId = parseInt(id, 10);
        if (isNaN(parcelId)) {
            return NextResponse.json({ error: "Invalid parcel ID" }, { status: 400 });
        }

        // Parcel ownership kontrolü
        const parcel = await prisma.parcel.findUnique({
            where: { id: parcelId },
            select: { id: true, ownerId: true, assignedTo: true, city: true, district: true, parsel: true }
        });

        if (!parcel) {
            return NextResponse.json({ error: "Parcel not found" }, { status: 404 });
        }

        const isOwner = parcel.ownerId === userId;
        const isAssigned = parcel.assignedTo === userId;
        const isUserAdmin = isAdmin((user as any).role as string);

        if (!isOwner && !isAssigned && !isUserAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Geçici paylaşım linki oluştur (PDF için)
        const token = crypto.randomBytes(16).toString("hex");
        const shareLink = await prisma.presentationShare.create({
            data: {
                token,
                parcelId,
                createdById: userId,
                title: "__PDF_EXPORT_TEMP__",
                isActive: true
            }
        });
        shareLinkId = shareLink.id;

        console.log("[PDF Export] Share link created with ID:", shareLinkId);

        // Puppeteer için INTERNAL URL kullan
        const internalUrl = `http://localhost:3000/p/${token}`;

        // Debug log
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = request.headers.get("x-forwarded-proto") || "https";
        const externalUrl = `${protocol}://${host}/p/${token}`;

        console.log("[PDF Export] External URL:", externalUrl);
        console.log("[PDF Export] Internal URL:", internalUrl);
        console.log("[PDF Export] Token:", token);

        let browser = null;
        let pdfBuffer: Uint8Array;

        try {
            console.log("[PDF Export] Launching Puppeteer...");

            browser = await puppeteer.launch({
                headless: true,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-accelerated-2d-canvas",
                    "--disable-gpu",
                    "--single-process"
                ],
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
            });

            console.log("[PDF Export] Puppeteer launched successfully");

            const page = await browser.newPage();

            // Konsol mesajlarını logla
            page.on("console", msg => console.log("[PDF Export - Page Console]", msg.text()));
            page.on("pageerror", (err) => console.error("[PDF Export - Page Error]", String(err)));

            await page.setViewport({
                width: 794,
                height: 1123,
                deviceScaleFactor: 2
            });

            console.log("[PDF Export] Navigating to:", internalUrl);

            // Sayfaya git
            const response = await page.goto(internalUrl, {
                waitUntil: "networkidle0",
                timeout: 30000
            });

            console.log("[PDF Export] Navigation complete, status:", response?.status());

            // Sayfa içeriğini kontrol et
            const pageTitle = await page.title();
            console.log("[PDF Export] Page title:", pageTitle);

            // Ekstra bekleme
            await new Promise(resolve => setTimeout(resolve, 2000));

            console.log("[PDF Export] Creating PDF...");

            // PDF oluştur
            pdfBuffer = await page.pdf({
                format: "A4",
                printBackground: true,
                margin: {
                    top: "10mm",
                    right: "10mm",
                    bottom: "10mm",
                    left: "10mm"
                },
                preferCSSPageSize: false
            });

            console.log("[PDF Export] PDF created, size:", pdfBuffer.length, "bytes");

        } finally {
            if (browser) {
                await browser.close();
                console.log("[PDF Export] Browser closed");
            }
        }

        // PDF başarıyla oluşturulduktan SONRA token'ı sil
        if (shareLinkId) {
            await prisma.presentationShare.delete({
                where: { id: shareLinkId }
            });
            console.log("[PDF Export] Temp share link deleted");
        }

        // PDF dosya adı
        const filename = `Yatirimci_Sunumu_${parcel.city}_${parcel.district}_${parcel.parsel}.pdf`
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_.-]/g, "");

        const buffer = Buffer.from(pdfBuffer);

        console.log("[PDF Export] Sending PDF response:", filename);

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": buffer.length.toString()
            }
        });

    } catch (error: any) {
        console.error("[PDF Export] Error:", error.message);
        console.error("[PDF Export] Stack:", error.stack);

        // Hata durumunda da temp share link'i temizle
        if (shareLinkId) {
            try {
                await prisma.presentationShare.delete({
                    where: { id: shareLinkId }
                });
                console.log("[PDF Export] Cleaned up share link after error");
            } catch (deleteError) {
                console.error("[PDF Export] Failed to cleanup share link:", deleteError);
            }
        }

        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(
            { error: "PDF oluşturulurken bir hata oluştu: " + error.message },
            { status: 500 }
        );
    }
}
