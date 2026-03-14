## 2026-03-14 - Prevent PrismaClient Connection Exhaustion
**Learning:** Instantiating `new PrismaClient()` in individual Next.js API routes creates a new database connection pool per invocation (or hot reload), quickly exhausting database connection limits and severely degrading performance in this serverless architecture.
**Action:** Always import the global `prisma` singleton from `@/lib/prisma` across all API routes instead of creating local instances.
