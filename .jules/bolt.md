## 2024-03-31 - [Prisma Connection Pooling Issue]
**Learning:** Found multiple instances of `new PrismaClient()` in Next.js API routes which bypasses the shared connection pool and causes database connection exhaustion.
**Action:** Always import the shared singleton instance `import { prisma } from '@/lib/prisma';` instead of creating new instances.
