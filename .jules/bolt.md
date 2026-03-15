## 2024-05-18 - Replacing `new PrismaClient()` with shared instance
**Learning:** Found multiple instances of `new PrismaClient()` in API routes. In serverless and Next.js environments, this causes database connection exhaustion.
**Action:** Replace `new PrismaClient()` with `import { prisma } from "@/lib/prisma";` across all API routes to utilize a shared singleton instance.
