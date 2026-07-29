## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-05-31 - Nested Relation Overfetching in Stats Endpoints
**Learning:** In statistics endpoints like `app/api/properties/stats/route.ts`, using Prisma's `include` to fetch deeply nested relations (e.g., `units: true`, `transactions: true`) causes massive data payloads and Node.js memory bloat, because all columns are fetched into memory only to compute derived properties (like lengths or sums).
**Action:** Replace `include` with targeted `select` statements to explicitly pull only the exact fields needed for in-memory aggregations (e.g., `id`, `status`, `amount`, `monthlyRent`). This drastically reduces the database transfer payload and parsing overhead when full aggregation at the database level (`groupBy`) cannot be easily expressed due to complex logic.
