## 2024-05-18 - Replacing `new PrismaClient()` with shared instance
**Learning:** Found multiple instances of `new PrismaClient()` in API routes. In serverless and Next.js environments, this causes database connection exhaustion.
**Action:** Replace `new PrismaClient()` with `import { prisma } from "@/lib/prisma";` across all API routes to utilize a shared singleton instance.

## 2024-05-18 - Cloudflare Workers & Prisma
**Learning:** Found that Cloudflare Workers builds fail because `package.json` build step doesn't generate the prisma client, and API routes lack `export const runtime = 'nodejs'`.
**Action:** Append `prisma generate &&` to the build script in `package.json` and ensure `export const runtime = 'nodejs'` is present in `app/layout.tsx`.
