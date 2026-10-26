## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-08-09 - targeted Select Blocks for Stats Query and Unused Analytics Query
**Learning:** Found an anti-pattern in `app/api/properties/stats/route.ts` where `include` was used instead of `select` in `findMany()` queries. Also discovered an unused query (`monthlyTrend`) that computed values never returned in the JSON payload, wasting database resources.
**Action:** When calculating statistics that do not return the raw database objects, use explicit targeted `select` blocks (always including identifiers like `id` alongside required fields) instead of `include` to minimize database transfer payload and Node.js memory footprint. Also proactively search for and remove computed queries in API routes that do not contribute to the final returned payload.
