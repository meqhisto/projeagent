import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId } from "@/lib/auth/roleCheck";

export const runtime = "nodejs";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const parcelId = parseInt(id);
        if (isNaN(parcelId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const { content } = await request.json();
        if (!content?.trim()) return NextResponse.json({ error: "İçerik boş olamaz" }, { status: 400 });

        const note = await prisma.note.create({
            data: { content: content.trim(), parcelId },
        });
        return NextResponse.json(note, { status: 201 });
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAuth();
        const { id } = await params;
        const parcelId = parseInt(id);
        const { searchParams } = new URL(request.url);
        const noteId = parseInt(searchParams.get("noteId") || "");

        if (isNaN(noteId)) return NextResponse.json({ error: "Invalid note ID" }, { status: 400 });

        const note = await prisma.note.findUnique({ where: { id: noteId } });
        if (!note || note.parcelId !== parcelId) return NextResponse.json({ error: "Not found" }, { status: 404 });

        await prisma.note.delete({ where: { id: noteId } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
    }
}
