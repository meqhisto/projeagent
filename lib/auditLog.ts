/**
 * Audit Logging Utility
 * Tracks critical user actions for security and compliance
 */

import { prisma } from "./prisma";
import { getClientIP } from "./rateLimit";

// Action types for audit logging
export type AuditAction =
    | "LOGIN"
    | "LOGOUT"
    | "FAILED_LOGIN"
    | "PASSWORD_CHANGE"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "EXPORT"
    | "VIEW"
    | "RATE_LIMITED"
    | "IP_BLOCKED";

// Resource types
export type AuditResource =
    | "users"
    | "parcels"
    | "customers"
    | "tasks"
    | "documents"
    | "presentations"
    | "contractors"
    | "auth";

export interface AuditLogInput {
    userId?: number | null;
    action: AuditAction;
    resource: AuditResource | string;
    resourceId?: number | null;
    details?: Record<string, any> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    status?: "SUCCESS" | "FAILURE" | "BLOCKED";
}

/**
 * Log an audit event
 */
export async function logAudit(input: AuditLogInput): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: input.userId,
                action: input.action,
                resource: input.resource,
                resourceId: input.resourceId,
                details: input.details ? JSON.stringify(input.details) : null,
                ipAddress: input.ipAddress,
                userAgent: input.userAgent,
                status: input.status || "SUCCESS",
            },
        });
    } catch (error) {
        // Don't throw - audit logging should never break the main flow
        console.error("[Audit Log] Failed to save log:", error);
    }
}

/**
 * Log an audit event from a request context
 */
export async function logAuditFromRequest(
    request: Request,
    input: Omit<AuditLogInput, "ipAddress" | "userAgent">
): Promise<void> {
    const ipAddress = getClientIP(request);
    const userAgent = request.headers.get("user-agent");

    await logAudit({
        ...input,
        ipAddress,
        userAgent,
    });
}

/**
 * Shorthand for logging login events
 */
export async function logLogin(
    request: Request,
    userId: number | null,
    success: boolean,
    email?: string
): Promise<void> {
    await logAuditFromRequest(request, {
        userId,
        action: success ? "LOGIN" : "FAILED_LOGIN",
        resource: "auth",
        status: success ? "SUCCESS" : "FAILURE",
        details: email ? { email } : null,
    });
}

/**
 * Shorthand for logging CRUD operations
 */
export async function logCrudAction(
    request: Request,
    userId: number,
    action: "CREATE" | "UPDATE" | "DELETE",
    resource: AuditResource,
    resourceId?: number,
    details?: Record<string, any>
): Promise<void> {
    await logAuditFromRequest(request, {
        userId,
        action,
        resource,
        resourceId,
        details,
    });
}

/**
 * Get recent audit logs (for admin panel)
 */
export async function getRecentAuditLogs(options?: {
    limit?: number;
    userId?: number;
    action?: AuditAction;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    const where: any = {};

    if (options?.userId) where.userId = options.userId;
    if (options?.action) where.action = options.action;
    if (options?.resource) where.resource = options.resource;
    if (options?.startDate || options?.endDate) {
        where.createdAt = {};
        if (options.startDate) where.createdAt.gte = options.startDate;
        if (options.endDate) where.createdAt.lte = options.endDate;
    }

    return prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options?.limit || 100,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}

/**
 * Get security-related logs (failed logins, rate limits, IP blocks)
 */
export async function getSecurityLogs(limit = 50) {
    return prisma.auditLog.findMany({
        where: {
            action: {
                in: ["FAILED_LOGIN", "RATE_LIMITED", "IP_BLOCKED"],
            },
        },
        orderBy: { createdAt: "desc" },
        take: limit,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
        },
    });
}
