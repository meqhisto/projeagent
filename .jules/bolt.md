## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-06-18 - Parallelizing Independent Prisma Queries
**Learning:** Sequential `await prisma.model.findMany()` calls for completely independent data sets (e.g. searching parcels and customers separately) cause unnecessary latency. The total response time becomes the sum of both queries' durations.
**Action:** Use `Promise.all([prisma.model1.findMany(...), prisma.model2.findMany(...)])` to run independent database queries concurrently, reducing total fetch latency to that of the slowest single query.

## 2024-06-18 - Cloudflare Pages (next-on-pages) Node.js Runtime Failure
**Learning:** Adding `export const runtime = 'nodejs'` or `export const runtime = 'edge'` to an API route when next-on-pages is complaining about missing edge runtime on ALL routes does not fix the CI build. The project is specifically not configured to use edge runtime across the board, and modifying a single API route's runtime directive causes next-on-pages to fail during the Vercel build output generation.
**Action:** NEVER add runtime directives (like `export const runtime = 'nodejs'` or `export const runtime = 'edge'`) to Next.js API routes when implementing performance improvements unless explicitly requested or originally present. It breaks the deployment process.
