import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, getUserId, isAdmin } from "@/lib/auth/roleCheck";
import { runMatchForDemand } from "@/lib/demands/matchDemand";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = await requireAuth();
        const userId = await getUserId();
        const { id } = await params;
        const demandId = Number(id);

        const demand = await prisma.demandRequest.findUnique({ where: { id: demandId } });
        if (!demand) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
        if (!isAdmin(user.role as string) && demand.createdById !== userId) {
            return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
        }

        const count = await runMatchForDemand(demandId);
        return NextResponse.json({ matched: count });
    } catch (error: any) {
        if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        return NextResponse.json({ error: "Eşleştirme başarısız" }, { status: 500 });
    }
}
