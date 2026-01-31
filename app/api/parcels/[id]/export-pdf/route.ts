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
                title: "__PDF_EXPORT_TEMP__", // Internal marker
                isActive: true
            }
        });

        // Puppeteer için INTERNAL URL kullan (container içinden kendi kendine erişim)
        // Dış URL (host header'dan) kullanmak yerine localhost:3000 kullanıyoruz
        // çünkü Puppeteer aynı container'da çalışıyor
        const internalUrl = `http://localhost:3000/p/${token}`;

        // Debug log için dış URL'i de göster
        const host = request.headers.get("host") || "localhost:3000";
        const protocol = request.headers.get("x-forwarded-proto") || "https";
        const externalUrl = `${protocol}://${host}/p/${token}`;

        console.log("[PDF Export] External URL:", externalUrl);
        console.log("[PDF Export] Internal URL (Puppeteer will use):", internalUrl);
        console.log("[PDF Export] Token:", token);

        let browser = null;
        let pdfBuffer: Uint8Array;

        try {
            // Puppeteer başlat
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

            const page = await browser.newPage();

            // Viewport ayarla (A4 boyutunda)
            await page.setViewport({
                width: 794,  // A4 width in pixels at 96 DPI
                height: 1123, // A4 height in pixels at 96 DPI
                deviceScaleFactor: 2
            });

            console.log("[PDF Export] Navigating to:", internalUrl);

            // Sayfaya git ve tam yüklenmesini bekle
            await page.goto(internalUrl, {
                waitUntil: "networkidle0",
                timeout: 30000
            });

            // Ekstra bekleme (dinamik içerik için)
            await new Promise(resolve => setTimeout(resolve, 2000));

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

        } finally {
            // Browser'ı kapat
            if (browser) {
                await browser.close();
            }

            // Geçici share linkini sil
            await prisma.presentationShare.delete({
                where: { id: shareLink.id }
            });
        }

        // PDF dosya adı
        const filename = `Yatirimci_Sunumu_${parcel.city}_${parcel.district}_${parcel.parsel}.pdf`
            .replace(/\s+/g, "_")
            .replace(/[^a-zA-Z0-9_.-]/g, "");

        // Uint8Array'i Buffer'a dönüştür
        const buffer = Buffer.from(pdfBuffer);

        // PDF'i response olarak döndür
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": buffer.length.toString()
            }
        });

    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("PDF export error:", error);
        return NextResponse.json(
            { error: "PDF oluşturulurken bir hata oluştu" },
            { status: 500 }
        );
    }
}
