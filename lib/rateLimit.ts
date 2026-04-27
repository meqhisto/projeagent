/**
 * Enhanced Rate Limiter for Next.js API routes
 * Features: Per-endpoint limits, IP-based blocking, violation tracking
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

interface BlockedIP {
    blockedUntil: number;
    violations: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const blockedIPs = new Map<string, BlockedIP>();

// Block duration escalation (in milliseconds)
const BLOCK_DURATIONS = [
    5 * 60 * 1000,      // 1st violation: 5 minutes
    15 * 60 * 1000,     // 2nd violation: 15 minutes
    60 * 60 * 1000,     // 3rd violation: 1 hour
    24 * 60 * 60 * 1000 // 4+ violations: 24 hours
];

// Custom limits for sensitive endpoints
const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
    // Auth endpoints - most restrictive
    "/api/auth/verify": { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per minute
    "/api/auth/change-password": { maxRequests: 3, windowMs: 60 * 1000 }, // 3 per minute
    "/api/admin/users": { maxRequests: 10, windowMs: 60 * 1000 }, // Admin operations

    // Create/Update operations
    "/api/parcels": { maxRequests: 20, windowMs: 60 * 1000 },
    "/api/crm/customers": { maxRequests: 20, windowMs: 60 * 1000 },
    "/api/tasks": { maxRequests: 30, windowMs: 60 * 1000 },

    // PDF export - resource intensive
    "/api/parcels/export-pdf": { maxRequests: 5, windowMs: 60 * 1000 },

    // Default for other API routes
    "default": { maxRequests: 100, windowMs: 60 * 1000 },
};

/**
 * Get client IP from request
 */
export function getClientIP(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIP = request.headers.get("x-real-ip");

    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    if (realIP) {
        return realIP.trim();
    }
    return "unknown";
}

/**
 * Check if an IP is currently blocked
 */
export function isIPBlocked(ip: string): { blocked: boolean; remainingMs?: number } {
    const blockInfo = blockedIPs.get(ip);

    if (!blockInfo) {
        return { blocked: false };
    }

    const now = Date.now();

    if (now >= blockInfo.blockedUntil) {
        // Block has expired, don't remove yet (keep violation count)
        return { blocked: false };
    }

    return {
        blocked: true,
        remainingMs: blockInfo.blockedUntil - now
    };
}

/**
 * Block an IP address (called when rate limit is exceeded)
 */
function blockIP(ip: string): number {
    const existing = blockedIPs.get(ip);
    const violations = existing ? existing.violations + 1 : 1;
    const durationIndex = Math.min(violations - 1, BLOCK_DURATIONS.length - 1);
    const blockDuration = BLOCK_DURATIONS[durationIndex];

    blockedIPs.set(ip, {
        blockedUntil: Date.now() + blockDuration,
        violations
    });

    console.log(`[Rate Limit] IP ${ip} blocked for ${blockDuration / 1000 / 60} minutes (violation #${violations})`);

    return blockDuration;
}

/**
 * Manually unblock an IP (for admin use)
 */
export function unblockIP(ip: string): boolean {
    return blockedIPs.delete(ip);
}

/**
 * Get all blocked IPs (for admin monitoring)
 */
export function getBlockedIPs(): Array<{ ip: string; blockedUntil: Date; violations: number }> {
    const result: Array<{ ip: string; blockedUntil: Date; violations: number }> = [];
    const now = Date.now();

    for (const [ip, info] of blockedIPs.entries()) {
        if (info.blockedUntil > now) {
            result.push({
                ip,
                blockedUntil: new Date(info.blockedUntil),
                violations: info.violations
            });
        }
    }

    return result;
}

/**
 * Clean up expired entries
 */
function cleanup(): void {
    const now = Date.now();

    // Clean up rate limit entries
    for (const [key, entry] of rateLimitMap.entries()) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(key);
        }
    }

    // Clean up old block entries (keep for 48 hours for violation history)
    const maxAge = 48 * 60 * 60 * 1000;
    for (const [ip, info] of blockedIPs.entries()) {
        if (now > info.blockedUntil + maxAge) {
            blockedIPs.delete(ip);
        }
    }
}

// Run cleanup every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    resetTime: number;
    blocked?: boolean;
    blockedFor?: number; // milliseconds
}

/**
 * Check rate limit for a request
 */
export function rateLimit(request: Request, pathname?: string): RateLimitResult {
    const clientIP = getClientIP(request);
    const path = pathname || new URL(request.url).pathname;

    // Check if IP is blocked first
    const blockStatus = isIPBlocked(clientIP);
    if (blockStatus.blocked) {
        return {
            success: false,
            limit: 0,
            remaining: 0,
            resetTime: Date.now() + (blockStatus.remainingMs || 0),
            blocked: true,
            blockedFor: blockStatus.remainingMs
        };
    }

    // Get limit config for this path
    const config = RATE_LIMITS[path] || RATE_LIMITS["default"];
    const { maxRequests, windowMs } = config;

    const key = `${clientIP}:${path}`;
    const now = Date.now();

    let entry = rateLimitMap.get(key);

    if (!entry || now > entry.resetTime) {
        // New or expired entry
        entry = {
            count: 1,
            resetTime: now + windowMs,
        };
        rateLimitMap.set(key, entry);

        return {
            success: true,
            limit: maxRequests,
            remaining: maxRequests - 1,
            resetTime: entry.resetTime,
        };
    }

    // Increment count
    entry.count++;

    if (entry.count > maxRequests) {
        // Rate limit exceeded - block the IP
        const blockDuration = blockIP(clientIP);

        return {
            success: false,
            limit: maxRequests,
            remaining: 0,
            resetTime: entry.resetTime,
            blocked: true,
            blockedFor: blockDuration
        };
    }

    return {
        success: true,
        limit: maxRequests,
        remaining: maxRequests - entry.count,
        resetTime: entry.resetTime,
    };
}

/**
 * Rate limit response headers
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
    const headers: Record<string, string> = {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetTime.toString(),
    };

    if (result.blocked) {
        headers["Retry-After"] = Math.ceil((result.blockedFor || 0) / 1000).toString();
    }

    return headers;
}
