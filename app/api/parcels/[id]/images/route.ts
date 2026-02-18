import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

// GET - List all images for a parcel
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const images = await prisma.image.findMany({
            where: { parcelId: parseInt(params.id) },
            orderBy: [
                { isDefault: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        return NextResponse.json(images);
    } catch (error) {
        console.error("GET images error:", error);
        return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
    }
}

// POST - Upload a new image
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const setAsDefault = formData.get("setAsDefault") === "true";

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate file type
        const validImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!validImageTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only JPG, PNG, WEBP allowed" }, { status: 400 });
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Maximum 5MB" }, { status: 400 });
        }

        const parcelId = parseInt(params.id);

        // Create directory if not exists
        const uploadDir = path.join(process.cwd(), "public", "uploads", "parcels", params.id, "images");
        await mkdir(uploadDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const ext = path.extname(file.name);
        const fileName = `${timestamp}${ext}`;
        const filePath = path.join(uploadDir, fileName);

        // Save file
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // If setAsDefault, unset other defaults
        if (setAsDefault) {
            await prisma.image.updateMany({
                where: { parcelId, isDefault: true },
                data: { isDefault: false }
            });
        }

        // Create database entry
        const image = await prisma.image.create({
            data: {
                parcelId,
                url: `/uploads/parcels/${params.id}/images/${fileName}`,
                type: "UPLOADED",
                source: "USER",
                isDefault: setAsDefault
            }
        });

        return NextResponse.json(image);
    } catch (error) {
        console.error("POST image error:", error);
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }
}

// DELETE - Delete an image
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { searchParams } = new URL(request.url);
        const imageId = searchParams.get("imageId");

        if (!imageId) {
            return NextResponse.json({ error: "Image ID required" }, { status: 400 });
        }

        // Delete from database
        await prisma.image.delete({
            where: { id: parseInt(imageId) }
        });

        // Note: File deletion from disk could be added here
        // but requires more careful handling

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE image error:", error);
        return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
    }
}
export const runtime = 'nodejs';
