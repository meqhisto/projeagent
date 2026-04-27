import { auth } from "@/auth.config";

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

export async function getUserId() {
    const user = await requireAuth();
    return parseInt(user.id || "0");
}

export function isAdmin(role: string) {
    return role === "ADMIN";
}
