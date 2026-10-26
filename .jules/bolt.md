## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-07-11 - [Optimize properties stats endpoint memory usage]
**Learning:** Returning large `findMany()` payloads with heavy `include` relations on dashboard/analytics routes (like `/api/properties/stats`) will cause extreme Node.js memory bloat and degrade performance. Attempting to manually iterate arrays in-memory to build grouping maps and count structures compounds the issue as the data scales.
**Action:** Replace `findMany()` queries that exist solely to perform math/filtering with multiple concurrent database-level aggregations (`count`, `aggregate`, `groupBy`) wrapped in a `Promise.all()`. Manually reconstruct the required API structures in Next.js from these optimized database results, utilizing exact dictionary fallback types (e.g. `const statusCounts = { AVAILABLE: 0, ... }; statusGroup.forEach(...)`) to safely and quickly serve analytics payload without regressions.
