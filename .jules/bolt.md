## 2024-03-31 - [Prisma Connection Pooling Issue]
**Learning:** Found multiple instances of `new PrismaClient()` in Next.js API routes which bypasses the shared connection pool and causes database connection exhaustion.
**Action:** Always import the shared singleton instance `import { prisma } from '@/lib/prisma';` instead of creating new instances.

## 2024-03-31 - [Cloudflare Workers & Prisma Compatibility]
**Learning:** Next.js edge runtime and Cloudflare Workers (next-on-pages) strictly require `export const runtime = 'nodejs'` in API routes that use Prisma, because Prisma Client contains Node.js specific code that cannot run on edge workers. Replacing direct instantiation with the shared import triggers these Edge build failures.
**Action:** Add `export const runtime = 'nodejs';` to any API route file that imports Prisma and is failing Cloudflare builds.
