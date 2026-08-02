## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-08-02 - Analytics Database Query Unused Data Pattern
**Learning:** Found a performance anti-pattern in analytics routes where expensive Prisma database aggregation queries (like `groupBy`) were executed, but their results (like `monthlyTrend`) were never included in the JSON response payload. This resulted in an ESLint warning and an entirely unnecessary database workload. Furthermore, in the same endpoint, `include` was being used to fetch full related records into memory instead of a targeted `select`.
**Action:** When optimizing analytics routes, actively trace the usage of computed query results. Expensive queries whose results are never used downstream should be completely removed to eliminate unnecessary DB load. Also, replace `include` with targeted `select` statements to reduce DB transfer payload and Node.js memory bloat.
