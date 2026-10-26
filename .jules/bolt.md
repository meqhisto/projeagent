## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.
## 2026-08-18 - [Remove unused database query]
**Learning:** Found an unused database query (`monthlyTrend`) in `app/api/properties/stats/route.ts` which is executed but its results are never included in the JSON response payload. This results in unnecessary database operations and processing overhead. Unused calculations should always be pruned to save backend resources.
**Action:** Remove the unused `monthlyTrend` calculation completely.
## 2026-08-18 - [Avoid fetching full records for statistics]
**Learning:** Found a full record fetch (`include: { units: true, transactions: true }`) in `app/api/properties/stats/route.ts` just to calculate statistics and aggregate values. This pulls huge amounts of unused fields into memory, causing Node.js memory bloat and latency.
**Action:** Replace full `include` and `findMany` with targeted database aggregations like `Promise.all([prisma.property.count(), ...])`, or use `select` to only bring back the required calculation fields if aggregations are too complex.
