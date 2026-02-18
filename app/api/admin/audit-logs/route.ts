import { NextResponse } from "next/server";
import { requireAuth, isAdmin } from "@/lib/auth/roleCheck";
import { getRecentAuditLogs, getSecurityLogs } from "@/lib/auditLog";

export async function GET(request: Request) {
    try {
        const user = await requireAuth();

        // Only admins can view audit logs
        if (!isAdmin((user as any).role as string)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type"); // "security" or "all"
        const limit = parseInt(searchParams.get("limit") || "100");
        const userId = searchParams.get("userId");
        const action = searchParams.get("action");
        const resource = searchParams.get("resource");
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (type === "security") {
            const logs = await getSecurityLogs(limit);
            return NextResponse.json(logs);
        }

        const logs = await getRecentAuditLogs({
            limit,
            userId: userId ? parseInt(userId) : undefined,
            action: action as any,
            resource: resource || undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("GET /api/admin/audit-logs error:", error);
        return NextResponse.json(
            { error: "Failed to fetch audit logs" },
            { status: 500 }
        );
    }
}
export const runtime = 'nodejs';
