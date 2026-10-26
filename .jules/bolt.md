## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-06-22 - Optimizing Complex Relational Aggregations
**Learning:** Computing totals (e.g. sums of values, rents, transactions) in memory across nested relations after fetching them all via `findMany()` with `include` causes immense memory bloat and slow network payloads. Prisma's DB-level aggregations (`count`, `aggregate`, `groupBy`) are much faster but require care with `Promise.all()` to run concurrently, and handling typed fallback values (e.g., `_sum.amount || 0`) is essential to prevent null errors.
**Action:** When calculating statistics across multiple tables (like properties, units, and transactions), use `Promise.all` with targeted Prisma aggregations instead of one large `findMany()`, and stitch the results back together in memory. Always ensure fallback `0`s for nullable `_sum` results.
