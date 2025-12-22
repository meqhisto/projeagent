/**
 * Simple in-memory rate limiter for Next.js API routes
 * No external dependencies required
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Custom limits for sensitive endpoints
const RATE_LIMITS: Record<string, { maxRequests: number; windowMs: number }> = {
    // Auth endpoints - more restrictive
    "/api/auth/verify": { maxRequests: 5, windowMs: 60 * 1000 }, // 5 per minute
    "/api/auth/change-password": { maxRequests: 3, windowMs: 60 * 1000 }, // 3 per minute

    // Create operations
    "/api/parcels": { maxRequests: 20, windowMs: 60 * 1000 }, // 20 per minute (POST)
    "/api/crm/customers": { maxRequests: 20, windowMs: 60 * 1000 },
    "/api/tasks": { maxRequests: 30, windowMs: 60 * 1000 },

    // Default for other API routes
    "default": { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
};

/**
 * Get client identifier from request
 */
function getClientId(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
    return ip;
}

/**
 * Clean up expired entries (call periodically)
 */
function cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
        if (now > entry.resetTime) {
            rateLimitMap.delete(key);
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
}

/**
 * Check rate limit for a request
 */
export function rateLimit(request: Request, pathname?: string): RateLimitResult {
    const clientId = getClientId(request);
    const path = pathname || new URL(request.url).pathname;

    // Get limit config for this path
    const config = RATE_LIMITS[path] || RATE_LIMITS["default"];
    const { maxRequests, windowMs } = config;

    const key = `${clientId}:${path}`;
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
        return {
            success: false,
            limit: maxRequests,
            remaining: 0,
            resetTime: entry.resetTime,
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
    return {
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": result.remaining.toString(),
        "X-RateLimit-Reset": result.resetTime.toString(),
    };
}
