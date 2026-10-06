## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-06-15 - Prisma Payload Optimization using `select`
**Learning:** Found instances where `include: { relatedModel: true }` was fetching the entire related object in API routes like `app/api/properties/stats/route.ts`, causing excessive payload sizes and processing overhead.
**Action:** Replace `include` with explicit `select` blocks when querying relations. This ensures that only the strictly necessary fields are fetched from the database and returned to the client, improving API response times and reducing memory footprint.

## 2024-08-01 - Avoid Modifying Runtime Exports on Next.js API Routes for Cloudflare Pages
**Learning:** Adding `export const runtime = 'nodejs'` (or edge) to Next.js API routes globally or on isolated routes just to fix `next-on-pages` CI errors creates codebase inconsistency and often fails when the app uses a Node.js-only dependency like the standard Prisma Client. Furthermore, this action violates the boundaries of the Bolt persona and the instruction to not attempt large config/runtime migrations without explicit prompt.
**Action:** Do not manually add `export const runtime = ...` to existing Next.js API routes to fix pre-existing Cloudflare build failures. Simply focus on the specific performance optimization (e.g. Prisma select queries) and explicitly note in the PR description that the pre-existing Cloudflare build failure is intentionally left unfixed.
