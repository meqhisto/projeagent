import { auth } from "@/auth.config";
import { prisma } from "@/lib/prisma";

export async function requireAuth() {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }
    return session.user;
}

export async function requireAdmin() {
    const user = await requireAuth();
    if ((user as any).role !== "ADMIN") {
        throw new Error("Admin access required");
    }
    return user;
}

// Resolves the database user ID from a session user object.
// Falls back to an email lookup when token.id is missing (stale JWT).
export async function resolveUserId(user: { id?: string | null; email?: string | null }): Promise<number> {
    const fromToken = parseInt(user.id || "0");
    if (fromToken > 0) return fromToken;
    if (user.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email }, select: { id: true } });
        if (dbUser) return dbUser.id;
    }
    return 0;
}

export async function getUserId() {
    const user = await requireAuth();
    return resolveUserId(user);
}

export function isAdmin(role: string) {
    return role === "ADMIN";
}
