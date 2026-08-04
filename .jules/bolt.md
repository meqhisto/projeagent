## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-05-31 - Sequential Query Execution and Overfetching Anti-Pattern
**Learning:** Sequential Prisma operations (`findMany`, `groupBy`) in aggregation endpoints combined with large `include` objects create unnecessary database latency and memory bloat. Results from unused intermediate queries (`monthlyTrend`) block execution for no functional benefit.
**Action:** Use `Promise.all` to concurrently execute independent queries. Replace deeply nested `include` blocks with targeted `select` structures to fetch only the explicitly required fields (e.g. `id`, `amount`, `status`) to significantly reduce the response payload size and overall runtime latency. Unused database queries that are completely decoupled from the endpoint's response and core logic must be safely removed to eliminate pointless database load, rather than executing them anyway.
