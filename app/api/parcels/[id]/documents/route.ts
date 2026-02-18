import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

// GET - List all documents for a parcel
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const documents = await prisma.document.findMany({
            where: { parcelId: parseInt(params.id) },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(documents);
    } catch (error) {
        console.error("GET documents error:", error);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }
}

// POST - Upload a new document
export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const docName = formData.get("name") as string;
        const description = formData.get("description") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!docName) {
            return NextResponse.json({ error: "Document name required" }, { status: 400 });
        }

        // Validate file type
        const validDocTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
            "application/msword", // doc
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
            "application/vnd.ms-excel", // xls
            "text/plain"
        ];

        if (!validDocTypes.includes(file.type)) {
            return NextResponse.json({ error: "Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, TXT allowed" }, { status: 400 });
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: "File too large. Maximum 10MB" }, { status: 400 });
        }

        const parcelId = parseInt(params.id);

        // Create directory if not exists
        const uploadDir = path.join(process.cwd(), "public", "uploads", "parcels", params.id, "documents");
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

        // Create database entry
        const document = await prisma.document.create({
            data: {
                parcelId,
                name: docName,
                fileName: fileName,
                filePath: `/uploads/parcels/${params.id}/documents/${fileName}`,
                fileType: file.type,
                fileSize: file.size,
                description: description || null
            }
        });

        return NextResponse.json(document);
    } catch (error) {
        console.error("POST document error:", error);
        return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
    }
}

// DELETE - Delete a document
export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const { searchParams } = new URL(request.url);
        const documentId = searchParams.get("documentId");

        if (!documentId) {
            return NextResponse.json({ error: "Document ID required" }, { status: 400 });
        }

        // Delete from database
        await prisma.document.delete({
            where: { id: parseInt(documentId) }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE document error:", error);
        return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }
}
export const runtime = 'nodejs';
