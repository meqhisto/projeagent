## 2026-03-14 - Prevent PrismaClient Connection Exhaustion
**Learning:** Instantiating `new PrismaClient()` in individual Next.js API routes creates a new database connection pool per invocation (or hot reload), quickly exhausting database connection limits and severely degrading performance in this serverless architecture.
**Action:** Always import the global `prisma` singleton from `@/lib/prisma` across all API routes instead of creating local instances.
## 2026-03-14 - Ensure nodejs Runtime in layout.tsx
**Learning:** Next.js deployed on Cloudflare Workers requires the explicitly set Node.js runtime to properly execute Prisma Client since Prisma depends on standard Node.js APIs which differ in edge runtimes. This requirement extends to layout files like `app/layout.tsx`.
**Action:** Always ensure `export const runtime = 'nodejs';` is present in `app/layout.tsx` to fulfill the architectural constraint for Prisma compatibility in the target deployment environment.
